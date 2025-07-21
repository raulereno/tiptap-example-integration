'use client'

import React, { useRef, useState, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Download, Save } from '@mui/icons-material'

// Local imports
import TiptapEditor, { TiptapEditorRef, PlaceholderPos } from '@/components/TiptapEditor/TiptapEditor'
import TiptapToolbar from '@/components/Toolbar/TiptapToolbar'
import SpinnerLoader from '@/components/Common/SpinnerLoader'
import { saveDraft } from '@/services/cases'
import { exportToDocx } from '@/utils/exportToDocx'
import { useEditorDebounce } from '@/hooks/useDebounce'

/**
 * Main content component for the document editor page
 * Handles all the core functionality including saving, placeholder detection, and export
 */
function EditDocumentContent() {
  // ============================================================================
  // URL PARAMETERS & REFERENCES
  // ============================================================================
  
  const searchParams = useSearchParams()
  const docUrl = searchParams?.get('doc') // Get document URL from query parameters
  const editorRef = useRef<TiptapEditorRef>(null) // Reference to the Tiptap editor instance

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Placeholder management
  const [placeholders, setPlaceholders] = useState<PlaceholderPos[]>([])
  
  // Save state management
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Editor readiness states
  const [isDocumentReady, setIsDocumentReady] = useState(false)
  const [isEditorReady, setIsEditorReady] = useState(false)

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Formats placeholder text for display in the sidebar
   * Converts placeholder syntax to human-readable format
   * 
   * @param placeholderText - Raw placeholder text (e.g., "{{user_name}}", "[company_name]")
   * @returns Formatted text (e.g., "User Name", "Company Name")
   */
  const formatPlaceholderText = useCallback((placeholderText: string): string => {
    // Remove placeholder delimiters: {}, [], {{}}
    let text = placeholderText.replace(/[{}[\]]/g, '')
    
    // Convert snake_case or kebab-case to Title Case
    text = text
      .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
      .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
    
    return text
  }, [])

  // ============================================================================
  // CORE BUSINESS LOGIC
  // ============================================================================

  /**
   * Handles saving the document content to the backend
   * Updates save state and timestamps
   * 
   * @param html - The HTML content to save
   */
  const handleSave = useCallback(async (html: string) => {
    // Validate input
    if (!html || typeof html !== 'string' || !html.trim()) return
    
    setIsSaving(true)
    try {
      await saveDraft(html)
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to save draft:', error)
    } finally {
      setIsSaving(false)
    }
  }, [])

  /**
   * Detects and extracts placeholders from the current editor content
   * Supports multiple placeholder formats: {{variable}}, [variable], {{variable|label}}
   * Updates the placeholders state only when changes are detected
   */
  const handlePlaceholderUpdate = useCallback(() => {
    if (!editorRef.current?.editor) return
    
    const editorInstance = editorRef.current.editor
    const placeholderRegex = /{{.*?}}|\[.*?\]/g
    const found: PlaceholderPos[] = []

    // Traverse all text nodes in the document
    editorInstance.state.doc.descendants((node: { isText: boolean; text?: string }, pos: number) => {
      if (!node.isText) return

      const text = node.text || ''
      let match
      const regex = new RegExp(placeholderRegex.source, 'g')
      
      // Find all placeholder matches in this text node
      while ((match = regex.exec(text)) !== null) {
        const rawText = match[0]

        // Skip empty placeholders for cleaner navigation
        if (rawText === '[]' || rawText === '{}' || rawText === '{{}}') {
          continue
        }

        let label = rawText

        // Handle different placeholder formats
        if (rawText.startsWith('{{') && rawText.endsWith('}}')) {
          // Format: {{variable|label}} - extract the label
          const parts = rawText.slice(2, -2).split('|')
          if (parts.length > 1) {
            const potentialLabel = parts[parts.length - 2]
            if (potentialLabel) {
              label = potentialLabel.trim()
            }
          }
        } else if (rawText.startsWith('[') && rawText.endsWith(']')) {
          // Format: [variable] - extract the variable name
          label = rawText.slice(1, -1).trim()
        }

        found.push({
          text: rawText,
          label: label,
          from: pos + match.index,
          to: pos + match.index + rawText.length,
        })
      }
    })

    // Optimize re-renders by only updating when placeholders actually change
    setPlaceholders(prevPlaceholders => {
      if (prevPlaceholders.length !== found.length) {
        return found
      }
      
      const hasChanged = found.some((newPlaceholder, index) => {
        const prevPlaceholder = prevPlaceholders[index]
        return !prevPlaceholder || 
               newPlaceholder.text !== prevPlaceholder.text ||
               newPlaceholder.from !== prevPlaceholder.from ||
               newPlaceholder.to !== prevPlaceholder.to
      })
      
      return hasChanged ? found : prevPlaceholders
    })
  }, [])

  // ============================================================================
  // DEBOUNCED OPERATIONS
  // ============================================================================

  /**
   * Debounced editor operations to prevent excessive API calls
   * Automatically saves content and updates placeholders after 5 seconds of inactivity
   */
  const { debouncedUpdate, manualSave, isManualSaveDisabled } = useEditorDebounce(
    handleSave,
    handlePlaceholderUpdate,
    5000 // 5 second delay
  )

  /**
   * Handles editor content updates
   * Triggers debounced save and placeholder detection
   * 
   * @param html - Updated HTML content from the editor
   */
  const handleEditorUpdate = useCallback((html: string) => {
    setHasUnsavedChanges(true)
    debouncedUpdate(html)
  }, [debouncedUpdate])

  /**
   * Handles manual save button clicks
   * Bypasses debouncing for immediate save
   */
  const handleManualSave = useCallback(async () => {
    if (!editorRef.current) return
    
    const html = editorRef.current.getContent()
    if (html && !isManualSaveDisabled) {
      await manualSave(html)
    }
  }, [manualSave, isManualSaveDisabled])

  // ============================================================================
  // PLACEHOLDER NAVIGATION
  // ============================================================================

  /**
   * Handles initial placeholder detection when document loads
   * Only used for initial load; subsequent updates use debounced detection
   * 
   * @param list - List of placeholders found in the document
   */
  const handlePlaceholders = useCallback((list: PlaceholderPos[]) => {
    setPlaceholders(list)
  }, [])

  /**
   * Navigates the editor cursor to a specific placeholder
   * 
   * @param pos - Placeholder position information
   */
  const navigateToPlaceholder = useCallback((pos: PlaceholderPos) => {
    editorRef.current?.navigateToPlaceholder(pos)
  }, [])

  // ============================================================================
  // EXPORT FUNCTIONALITY
  // ============================================================================

  /**
   * Exports the current document content to DOCX format
   * Generates a timestamped filename and triggers download
   */
  const handleExport = useCallback(async () => {
    if (!editorRef.current) return
    
    const html = editorRef.current.getContent()
    const filename = `document-${Date.now()}.docx`
    
    try {
      await exportToDocx(html, filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export document')
    }
  }, [])

  // ============================================================================
  // EFFECTS & LIFECYCLE MANAGEMENT
  // ============================================================================

  /**
   * Monitors editor and document loading status
   * Ensures proper initialization sequence for document loading
   */
  React.useEffect(() => {
    if (!docUrl) {
      // No document URL means we're creating a new document
      setIsDocumentReady(true)
      return
    }

    // Check both editor readiness and loading status
    const checkStatus = () => {
      const editor = editorRef.current
      if (editor?.isReady && !editor?.isLoading) {
        setIsEditorReady(true)
        // Add delay to ensure document import is complete
        setTimeout(() => {
          setIsDocumentReady(true)
        }, 500)
      }
    }

    // Check immediately and set up periodic checking
    checkStatus()
    const interval = setInterval(checkStatus, 100)

    return () => clearInterval(interval)
  }, [docUrl])

  /**
   * Sets editor ready state when no document URL is provided
   * Handles the case of creating a new document
   */
  React.useEffect(() => {
    if (!docUrl) {
      setIsEditorReady(true)
    }
  }, [docUrl])

  /**
   * Debug logging for editor readiness
   */
  React.useEffect(() => {
    if (isEditorReady) {
      console.log('Editor is ready and toolbar should be enabled')
    }
  }, [isEditorReady])

  // ============================================================================
  // MEMOIZED COMPONENTS
  // ============================================================================

  /**
   * Memoized sidebar content for placeholder navigation
   * Only renders when placeholders exist and prevents unnecessary re-renders
   */
  const sidebarContent = useMemo(() => {
    if (placeholders.length === 0) return null

    return (
      <div className="fixed top-0 right-0 w-72 bg-white flex flex-col z-10 h-full pt-24 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
        {/* Sidebar Header */}
        <div className="font-semibold mb-2 p-4 bg-white shadow-sm sticky top-0 z-10">
          Placeholders 
          <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">
            {placeholders.length}
          </span>
        </div>
        
        {/* Placeholder List */}
        <div className="flex flex-col gap-2 p-4 overflow-y-auto flex-1">
          {placeholders.map((placeholder, index) => (
            <button
              key={`${placeholder.from}-${index}`}
              className="placeholder-item text-left px-3 py-2 rounded border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 ease-out transform hover:scale-[1.02]"
              onClick={() => navigateToPlaceholder(placeholder)}
              title={placeholder.text}
            >
              <div className="text-sm font-medium text-gray-800 truncate">
                {formatPlaceholderText(placeholder.text)}
              </div>
              <div className="text-xs text-gray-500 truncate mt-1">
                {placeholder.text}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }, [placeholders, navigateToPlaceholder, formatPlaceholderText])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header with Navigation and Actions */}
      <div className="fixed top-0 left-0 w-full z-20">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Navigation Bar */}
            <div className="flex justify-between items-center h-12">
              {/* Back Navigation */}
              <div className="flex items-center">
                <Link 
                  href="/"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Back to Home
                </Link>
              </div>
              
              {/* Action Buttons and Status */}
              <div className="flex items-center space-x-4">
                {/* Save Status Indicators */}
                {isSaving && (
                  <span className="text-sm text-gray-500">Saving...</span>
                )}
                {lastSaved && (
                  <span className="text-sm text-gray-500">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                {hasUnsavedChanges && !isSaving && (
                  <span className="text-sm text-orange-600 font-medium">
                    • Unsaved changes
                  </span>
                )}
                
                {/* Save Button */}
                <button
                  onClick={handleManualSave}
                  disabled={isManualSaveDisabled || isSaving || !hasUnsavedChanges}
                  className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 font-medium ${
                    isManualSaveDisabled || isSaving || !hasUnsavedChanges
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                  }`}
                  title={
                    isSaving 
                      ? "Saving..." 
                      : !hasUnsavedChanges 
                        ? "No changes to save" 
                        : "Save Draft"
                  }
                >
                  <Save sx={{ fontSize: 16 }} />
                  <span className="text-sm">
                    {isSaving ? 'Saving...' : !hasUnsavedChanges ? 'Saved' : 'Save Draft'}
                  </span>
                </button>
                
                {/* Export Button */}
                <button
                  onClick={handleExport}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                  title="Download DOCX"
                >
                  <Download sx={{ fontSize: 16 }} />
                  <span className="text-sm">Download</span>
                </button>
              </div>
            </div>
            
            {/* Editor Toolbar */}
            <TiptapToolbar 
              editor={editorRef.current?.editor || null} 
              isLoading={Boolean(docUrl && !isDocumentReady) || !isEditorReady} 
            />
          </div>
        </header>
      </div>

      {/* Placeholder Navigation Sidebar */}
      {sidebarContent}

      {/* Main Content Area */}
      <div className={`pt-28 ${placeholders.length > 0 ? 'pr-72' : ''}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            {/* Tiptap Editor Component */}
            <TiptapEditor
              ref={editorRef}
              docUrl={docUrl || undefined}
              onUpdate={handleEditorUpdate}
              onPlaceholders={handlePlaceholders}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Main page component with Suspense boundary
 * Provides loading state while the main content initializes
 */
export default function EditDocumentPage() {
  return (
    <Suspense fallback={<SpinnerLoader />}>
      <EditDocumentContent />
    </Suspense>
  )
} 