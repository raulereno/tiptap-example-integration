/**
 * Mocked API helpers for saving drafts
 * In a real application, these would make actual API calls
 */

export interface DraftData {
  id?: string
  content: string
  timestamp: number
}

// In-memory storage for demo purposes
const drafts: DraftData[] = []

/**
 * Save a draft of the document content
 * @param html - The HTML content to save
 * @returns Promise that resolves when save is complete
 */
export async function saveDraft(html: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const draft: DraftData = {
    id: Date.now().toString(),
    content: html,
    timestamp: Date.now(),
  }
  
  // In a real app, this would be an API call
  drafts.push(draft)
  
  // Keep only last 10 drafts
  if (drafts.length > 10) {
    drafts.shift()
  }
  
  console.log('Draft saved:', draft.id)
}

/**
 * Get all saved drafts
 * @returns Promise that resolves to array of drafts
 */
export async function getDrafts(): Promise<DraftData[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  return [...drafts].reverse() // Most recent first
}

/**
 * Get a specific draft by ID
 * @param id - Draft ID
 * @returns Promise that resolves to draft or null
 */
export async function getDraft(id: string): Promise<DraftData | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return drafts.find(draft => draft.id === id) || null
}

/**
 * Delete a draft
 * @param id - Draft ID to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteDraft(id: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const index = drafts.findIndex(draft => draft.id === id)
  if (index !== -1) {
    drafts.splice(index, 1)
  }
  
  console.log('Draft deleted:', id)
} 