import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ISectionOptions } from 'docx'

/**
 * Convert HTML to DOCX document structure
 * @param html - Raw HTML from editor
 * @returns Array of document elements
 */
function htmlToDocxElements(html: string): (Paragraph | Table)[] {
  // Simple HTML parser for basic elements
  const elements: (Paragraph | Table)[] = []
  
  // Remove script and style tags
  const cleanHtml = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<title[^>]*>.*?<\/title>/gi, '')
    .replace(/<head[^>]*>.*?<\/head>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')

  // Split by common block elements
  const blocks = cleanHtml.split(/(<\/?(?:h[1-6]|p|div|table|ul|ol|blockquote)[^>]*>)/gi)
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim()
    if (!block) continue

    // Handle headings
    if (block.match(/^<h([1-6])[^>]*>/i)) {
      const level = parseInt(block.match(/^<h([1-6])/i)![1])
      const text = blocks[i + 1] || ''
      const cleanText = text.replace(/<[^>]*>/g, '').trim()
      
      if (cleanText) {
        elements.push(
          new Paragraph({
            text: cleanText,
                         heading: `Heading${level}` as "Heading1" | "Heading2" | "Heading3" | "Heading4" | "Heading5" | "Heading6",
            spacing: { before: 400, after: 200 }
          })
        )
      }
      i++ // Skip the text content
    }
    // Handle paragraphs
    else if (block.match(/^<p[^>]*>/i)) {
      const text = blocks[i + 1] || ''
      const cleanText = text.replace(/<[^>]*>/g, '').trim()
      
      if (cleanText) {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText,
                size: 24, // 12pt
              })
            ],
            spacing: { before: 200, after: 200 }
          })
        )
      }
      i++ // Skip the text content
    }
    // Handle tables
    else if (block.match(/^<table[^>]*>/i)) {
      const tableContent = extractTableContent(blocks, i)
      if (tableContent) {
        elements.push(tableContent)
      }
      // Skip table content
      while (i < blocks.length && !blocks[i].match(/<\/table>/i)) {
        i++
      }
    }
    // Handle lists
    else if (block.match(/^<(ul|ol)[^>]*>/i)) {
      const listContent = extractListContent(blocks, i)
      elements.push(...listContent)
      // Skip list content
      while (i < blocks.length && !blocks[i].match(/<\/(ul|ol)>/i)) {
        i++
      }
    }
    // Handle blockquotes
    else if (block.match(/^<blockquote[^>]*>/i)) {
      const text = blocks[i + 1] || ''
      const cleanText = text.replace(/<[^>]*>/g, '').trim()
      
      if (cleanText) {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText,
                italics: true,
              })
            ],
            spacing: { before: 200, after: 200 },
            indent: { left: 720 } // 0.5 inch
          })
        )
      }
      i++ // Skip the text content
    }
    // Handle plain text
    else if (!block.startsWith('<') && !block.startsWith('</')) {
      const cleanText = block.replace(/<[^>]*>/g, '').trim()
      if (cleanText) {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanText,
                size: 24, // 12pt
              })
            ],
            spacing: { before: 200, after: 200 }
          })
        )
      }
    }
  }

  return elements
}

/**
 * Extract table content from HTML
 */
function extractTableContent(blocks: string[], startIndex: number): Table | null {
  const rows: TableRow[] = []
  let i = startIndex + 1

  while (i < blocks.length && !blocks[i].match(/<\/table>/i)) {
    if (blocks[i].match(/^<tr[^>]*>/i)) {
      const cells: TableCell[] = []
      let j = i + 1

      while (j < blocks.length && !blocks[j].match(/<\/tr>/i)) {
        if (blocks[j].match(/^<(td|th)[^>]*>/i)) {
          const text = blocks[j + 1] || ''
          const cleanText = text.replace(/<[^>]*>/g, '').trim()
          
          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cleanText,
                      size: 24,
                    })
                  ]
                })
              ],
              width: { size: 2000, type: WidthType.DXA }
            })
          )
          j++ // Skip the text content
        }
        j++
      }

      if (cells.length > 0) {
        rows.push(
          new TableRow({
            children: cells
          })
        )
      }
    }
    i++
  }

  return rows.length > 0 ? new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    }
  }) : null
}

/**
 * Extract list content from HTML
 */
function extractListContent(blocks: string[], startIndex: number): Paragraph[] {
  const elements: Paragraph[] = []
  let i = startIndex + 1

  while (i < blocks.length && !blocks[i].match(/<\/(ul|ol)>/i)) {
    if (blocks[i].match(/^<li[^>]*>/i)) {
      const text = blocks[i + 1] || ''
      const cleanText = text.replace(/<[^>]*>/g, '').trim()
      
      if (cleanText) {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${cleanText}`,
                size: 24,
              })
            ],
            spacing: { before: 100, after: 100 },
            indent: { left: 360 } // 0.25 inch
          })
        )
      }
      i++ // Skip the text content
    }
    i++
  }

  return elements
}

export async function POST(request: NextRequest) {
  try {
    const { html, filename } = await request.json()

    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      )
    }

    // Convert HTML to DOCX elements
    const children = htmlToDocxElements(html)

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440
              },
              size: {
                width: 11906, // A4 width
                height: 16838 // A4 height
              }
            }
          },
          children: children.length > 0 ? children : [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Empty document",
                  size: 24,
                })
              ]
            })
          ]
        }
      ]
    })

    // Generate DOCX buffer
    const buffer = await Packer.toBuffer(doc)

    // Return the DOCX file as a download
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename || 'document.docx'}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('DOCX export error:', error)
    return NextResponse.json(
      { error: 'Failed to export document' },
      { status: 500 }
    )
  }
} 