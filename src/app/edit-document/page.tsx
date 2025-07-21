'use client'

import React, { useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import TiptapEditor, { TiptapEditorRef, PlaceholderPos } from '@/components/TiptapEditor/TiptapEditor'
import TiptapToolbar from '@/components/Toolbar/TiptapToolbar'

import { saveDraft } from '@/services/cases'
import { exportToDocx } from '@/utils/exportToDocx'
import Link from 'next/link'
import useDebounce from '@/hooks/useDebounce'

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-3">
            <div>
              
              <div >
                <TiptapEditor
                  ref={editorRef}
                  docUrl={docUrl || undefined}
                  onUpdate={handleEditorUpdate}
                  onPlaceholders={handlePlaceholders}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Placeholders</h3>
              
              {placeholders.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No placeholders found in the document.
                </p>
              ) : (
                <div className="space-y-2">
                  {placeholders.map((pos, index) => (
                    <button
                      key={index}
                      onClick={() => navigateToPlaceholder(pos)}
                      className="block w-full text-left p-2 text-sm bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors"
                    >
                      Placeholder {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 