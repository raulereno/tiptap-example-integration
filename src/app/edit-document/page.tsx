'use client'

import React, { useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import TiptapEditor, { TiptapEditorRef, PlaceholderPos } from '@/components/TiptapEditor/TiptapEditor'
import TiptapToolbar from '@/components/Toolbar/TiptapToolbar'

import { saveDraft } from '@/services/cases'
import { exportToDocx } from '@/utils/exportToDocx'
import Link from 'next/link'
import useDebounce from '@/hooks/useDebounce'

// Function to format placeholder text
const formatPlaceholderText = (placeholderText: string): string => {
  // Remove the placeholder delimiters
  let text = placeholderText.replace(/[{}[\]]/g, '')
  
  // Convert snake_case or kebab-case to Title Case
  text = text
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
  
  return text
}

export default function EditDocumentPage() {
  const searchParams = useSearchParams()
  const docUrl = searchParams?.get('doc')
  
  const editorRef = useRef<TiptapEditorRef>(null)
  const [placeholders, setPlaceholders] = useState<PlaceholderPos[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

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
  const handleEditorUpdate = (html: string) => {
    debouncedSave(html)
  }

  // Handle placeholder detection
  const handlePlaceholders = (list: PlaceholderPos[]) => {
    console.log(`Received ${list.length} placeholders in component:`, list.map(p => p.text))
    setPlaceholders(list)
  }

  // Navigate to placeholder
  const navigateToPlaceholder = (pos: PlaceholderPos) => {
    editorRef.current?.navigateToPlaceholder(pos)
  }

  // Export document
  const handleExport = async () => {
    if (!editorRef.current) return
    
    const html = editorRef.current.getContent()
    const filename = `document-${Date.now()}.docx`
    
    try {
      await exportToDocx(html, filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export document')
    }
  }

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
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download DOCX
                </button>
              </div>
            </div>
            <TiptapToolbar 
              editor={editorRef.current?.editor || null} 
              isLoading={false} 
            />
          </div>
        </header>
      </div>

      {/* Fixed Sidebar */}
      <div className="fixed top-0 right-0 w-72 bg-white border-l flex flex-col z-10 h-full pt-24">
        <div className="font-semibold mb-2 p-4 bg-white border-b sticky top-0 z-10">
          Placeholders 
          <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">
            {placeholders.length}
          </span>
        </div>
        <div className="flex flex-col gap-2 p-4 overflow-y-auto flex-1">
          {placeholders.length > 0 ? (
            placeholders.map((placeholder, index) => (
              <button
                key={`${placeholder.from}-${index}`}
                className="text-left px-3 py-2 rounded border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
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
            ))
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              No placeholders found in the document
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="pr-72 pt-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
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