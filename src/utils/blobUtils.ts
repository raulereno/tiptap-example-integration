/**
 * Utility functions for managing blob URLs
 */

/**
 * Creates a blob URL for a file and returns a cleanup function
 * @param file - The file to create a blob URL for
 * @returns Object with blobUrl and cleanup function
 */
export function createBlobUrl(file: File): { blobUrl: string; cleanup: () => void } {
  const blobUrl = URL.createObjectURL(file)
  
  const cleanup = () => {
    URL.revokeObjectURL(blobUrl)
  }
  
  return { blobUrl, cleanup }
}

/**
 * Cleanup function for blob URLs
 * @param blobUrl - The blob URL to revoke
 */
export function revokeBlobUrl(blobUrl: string | null): void {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl)
  }
}

/**
 * Hook-like function to manage blob URL lifecycle
 * @param file - The file to create blob URL for
 * @returns Object with blobUrl and cleanup function
 */
export function useBlobUrl(file: File | null): { blobUrl: string | null; cleanup: () => void } {
  if (!file) {
    return { blobUrl: null, cleanup: () => {} }
  }
  
  const { blobUrl, cleanup } = createBlobUrl(file)
  return { blobUrl, cleanup }
} 