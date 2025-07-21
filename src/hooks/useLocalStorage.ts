import { useState, useEffect } from 'react'

/**
 * Custom hook for managing localStorage with React state
 * @param key - The localStorage key
 * @param initialValue - The initial value if key doesn't exist
 * @returns [value, setValue] - Current value and function to update it
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}

/**
 * Hook for managing document-related localStorage
 */
export function useDocumentStorage() {
  const [documentUrl, setDocumentUrl] = useLocalStorage<string | null>('tiptap_document_url', null)
  const [documentFilename, setDocumentFilename] = useLocalStorage<string | null>('tiptap_document_filename', null)

  const saveDocument = (url: string, filename?: string) => {
    setDocumentUrl(url)
    if (filename) {
      setDocumentFilename(filename)
    } else {
      setDocumentFilename(null)
    }
  }

  const clearDocument = () => {
    setDocumentUrl(null)
    setDocumentFilename(null)
  }

  return {
    documentUrl,
    documentFilename,
    saveDocument,
    clearDocument
  }
} 