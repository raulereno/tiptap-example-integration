'use client'

import React, { useRef, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import TiptapEditor, { TiptapEditorRef, PlaceholderPos } from '@/components/TiptapEditor/TiptapEditor'
import TiptapToolbar from '@/components/Toolbar/TiptapToolbar'

import { saveDraft } from '@/services/cases'
import { exportToDocx } from '@/utils/exportToDocx'
import Link from 'next/link'
import useDebounce from '@/hooks/useDebounce'
import { Download } from '@mui/icons-material'

export default function EditDocumentPage() {
  const searchParams = useSearchParams()
  const docUrl = searchParams?.get('doc')
  
  const editorRef = useRef<TiptapEditorRef>(null)
  const [placeholders, setPlaceholders] = useState<PlaceholderPos[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDocumentReady, setIsDocumentReady] = useState(false)
  const [isEditorReady, setIsEditorReady] = useState(false)

  // Function to format placeholder text
  const formatPlaceholderText = useCallback((placeholderText: string): string => {
    // Remove the placeholder delimiters
    let text = placeholderText.replace(/[{}[\]]/g, '')
    
    // Convert snake_case or kebab-case to Title Case
    text = text
      .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
      .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
    
    return text
  }, [])

  // Debounced save function
  const debouncedSave = useDebounce(async (html: string) => {
    if (!html || typeof html !== 'string' || !html.trim()) return
    
    setIsSaving(true)
    try {
      await saveDraft(html)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save draft:', error)
    } finally {
      setIsSaving(false)
    }
  }, 6000) // Save every 6 seconds

  // Handle editor updates
  const handleEditorUpdate = useCallback((html: string) => {
    debouncedSave(html)
  }, [debouncedSave])

  // Handle placeholder detection
  const handlePlaceholders = useCallback((list: PlaceholderPos[]) => {
    
    // Only update if placeholders actually changed
    setPlaceholders(prevPlaceholders => {
      // If length is different, definitely changed
      if (prevPlaceholders.length !== list.length) {
        return list
      }
      
      // Check if any placeholder text or position changed
      const hasChanged = list.some((newPlaceholder, index) => {
        const prevPlaceholder = prevPlaceholders[index]
        return !prevPlaceholder || 
               newPlaceholder.text !== prevPlaceholder.text ||
               newPlaceholder.from !== prevPlaceholder.from ||
               newPlaceholder.to !== prevPlaceholder.to
      })
      
      // Only return new array if something actually changed
      return hasChanged ? list : prevPlaceholders
    })
  }, [])

  // Navigate to placeholder
  const navigateToPlaceholder = useCallback((pos: PlaceholderPos) => {
    editorRef.current?.navigateToPlaceholder(pos)
  }, [])

  // Export document
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

  // Monitor editor and document status
  React.useEffect(() => {
    if (!docUrl) {
      // If no docUrl, document is ready immediately
      setIsDocumentReady(true)
      return
    }

    // Check both editor readiness and loading status
    const checkStatus = () => {
      const editor = editorRef.current
      if (editor?.isReady && !editor?.isLoading) {
        setIsEditorReady(true)
        // Add a small delay to ensure document import is complete
        setTimeout(() => {
          setIsDocumentReady(true)
        }, 500)
      }
    }

    // Check immediately
    checkStatus()

    // Set up interval to check periodically
    const interval = setInterval(checkStatus, 100)

    return () => clearInterval(interval)
  }, [docUrl])

  // Set editor ready when there's no docUrl
  React.useEffect(() => {
    if (!docUrl) {
      setIsEditorReady(true)
    }
  }, [docUrl])

  // Notify when editor is ready
  React.useEffect(() => {
    if (isEditorReady) {
      console.log('Editor is ready and toolbar should be enabled')
    }
  }, [isEditorReady])

  // Memoize the sidebar content to prevent unnecessary re-renders
  const sidebarContent = useMemo(() => {
    if (placeholders.length === 0) return null

    return (
      <div className="fixed top-0 right-0 w-72 bg-white flex flex-col z-10 h-full pt-24 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="font-semibold mb-2 p-4 bg-white shadow-sm sticky top-0 z-10">
          Placeholders 
          <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">
            {placeholders.length}
          </span>
        </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 w-full z-20">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-12">
              <div className="flex items-center">
                <Link 
                  href="/"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Back to Home
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                {isSaving && (
                  <span className="text-sm text-gray-500">Saving...</span>
                )}
                {lastSaved && (
                  <span className="text-sm text-gray-500">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
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
            <TiptapToolbar 
              editor={editorRef.current?.editor || null} 
              isLoading={Boolean(docUrl && !isDocumentReady) || !isEditorReady} 
            />
          </div>
        </header>
      </div>

      {/* Fixed Sidebar - Only show when there are placeholders */}
      {sidebarContent}

      {/* Main Content Area - Scrollable */}
      <div className={`pt-28 ${placeholders.length > 0 ? 'pr-72' : ''}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            {/* Always render the editor */}
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