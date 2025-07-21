/**
 * Utility for exporting HTML content to DOCX format
 * Uses server-side API endpoint for conversion
 */

/**
 * Convert HTML content to DOCX and trigger download
 * @param html - HTML content to convert
 * @param filename - Name for the downloaded file
 * @returns Promise that resolves when export is complete
 */
export async function exportToDocx(html: string, filename: string): Promise<void> {
  try {
    // Send HTML to server for conversion
    const response = await fetch('/api/export-docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html, filename }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    // Get the DOCX blob from the response
    const blob = await response.blob()
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('Export completed:', filename)
  } catch (error) {
    console.error('Export failed:', error)
    throw new Error('Failed to export document')
  }
}

/**
 * Convert HTML to DOCX blob (for programmatic use)
 * @param html - HTML content to convert
 * @returns Promise that resolves to Blob
 */
export async function htmlToDocxBlob(html: string): Promise<Blob> {
  try {
    const response = await fetch('/api/export-docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html, filename: 'document.docx' }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.blob()
  } catch (error) {
    console.error('HTML to DOCX conversion failed:', error)
    throw new Error('Failed to convert HTML to DOCX')
  }
}

/**
 * Get supported export formats
 * @returns Array of supported file extensions
 */
export function getSupportedFormats(): string[] {
  return ['.docx', '.html']
} 