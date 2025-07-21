'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Description, 
  Link as LinkIcon, 
  Add as AddIcon 
} from '@mui/icons-material'

export default function Home() {
  const [docUrl, setDocUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (docUrl.trim()) {
      setIsLoading(true)
      const encodedUrl = encodeURIComponent(docUrl.trim())
      router.push(`/edit-document?doc=${encodedUrl}`)
    }
  }

  const handleExampleDocument = () => {
    setIsLoading(true)
    // Example document URL - you can replace this with a real example
    const exampleUrl = '/docExample/placeholder_example.docx'
    const encodedUrl = encodeURIComponent(exampleUrl)
    router.push(`/edit-document?doc=${encodedUrl}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <main className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-4">Tiptap DOCX Demo</h1>
        <p className="text-lg text-gray-600 mb-4">A minimal, fully-commented example showing how to use Tiptap 3</p>
        
        {/* Main Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Option 1: Example Document */}
          <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow flex flex-col">
            <div className="flex justify-center mb-4">
              <Description sx={{ fontSize: 48, color: '#059669' }} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Example Document</h3>
            <p className="text-gray-600 mb-4 text-sm flex-grow">
              Start with a sample document to see how the editor works
            </p>
            <button
              onClick={handleExampleDocument}
              disabled={isLoading}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium mt-auto"
            >
              {isLoading ? 'Opening...' : 'Try Example'}
            </button>
          </div>

          {/* Option 2: Custom URL */}
          <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow flex flex-col">
            <div className="flex justify-center mb-4">
              <LinkIcon sx={{ fontSize: 48, color: '#2563eb' }} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Custom Document</h3>
            <p className="text-gray-600 mb-4 text-sm flex-grow">
              Import your own document from a URL
            </p>
            <form onSubmit={handleSubmit} className="space-y-3 mt-auto">
              <input
                type="url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://example.com/document.docx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                disabled={isLoading || !docUrl.trim()}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Opening...' : 'Import & Edit'}
              </button>
            </form>
          </div>

          {/* Option 3: Blank Document */}
          <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow flex flex-col">
            <div className="flex justify-center mb-4">
              <AddIcon sx={{ fontSize: 48, color: '#6b7280' }} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Blank Document</h3>
            <p className="text-gray-600 mb-4 text-sm flex-grow">
              Start from scratch and create something new
            </p>
            <Link 
              href="/edit-document"
              className="block w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium mt-auto"
            >
              Start Creating
            </Link>
          </div>
        </div>

        {/* Example URLs Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-3">💡 Example URLs you can try:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Direct DOCX file:</p>
              <code className="block bg-gray-100 px-3 py-2 rounded text-xs break-all">
                https://example.com/letter.docx
              </code>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Google Docs export:</p>
              <code className="block bg-gray-100 px-3 py-2 rounded text-xs break-all">
                https://docs.google.com/document/export?format=docx&id=...
              </code>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
