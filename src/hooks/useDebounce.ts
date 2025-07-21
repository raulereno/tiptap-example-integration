import { useRef, useCallback, useState } from 'react';

function useDebounce<T>(callback: (...args: T[]) => void, delay: number) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedCallback = (...args: T[]) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    };

    return debouncedCallback;
}

/**
 * Enhanced debounce hook for handling editor updates with combined save and placeholder detection
 */
export function useEditorDebounce(
    onSave: (html: string) => Promise<void>,
    onPlaceholdersUpdate: () => void,
    delay: number = 5000
) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const latestHtmlRef = useRef<string>('');
    const [isManualSaveDisabled, setIsManualSaveDisabled] = useState(false);

    const debouncedUpdate = useCallback((html: string) => {
        // Store the latest HTML
        latestHtmlRef.current = html;

        // Clear previous timeout
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Set new timeout for combined operations
        timerRef.current = setTimeout(async () => {
            try {
                // Execute save operation
                await onSave(latestHtmlRef.current);
                
                // Execute placeholder detection after save
                onPlaceholdersUpdate();
            } catch (error) {
                console.error('Error in debounced editor update:', error);
            }
            timerRef.current = null;
        }, delay);
    }, [onSave, onPlaceholdersUpdate, delay]);

    // Manual save function that bypasses debounce
    const manualSave = useCallback(async (html: string) => {
        // Cancel any pending debounced operations
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        try {
            // Execute save immediately
            await onSave(html);
            
            // Execute placeholder detection after save
            onPlaceholdersUpdate();
            
            // Disable manual save until next change
            setIsManualSaveDisabled(true);
        } catch (error) {
            console.error('Error in manual save:', error);
        }
    }, [onSave, onPlaceholdersUpdate]);

    // Function to re-enable manual save when content changes
    const handleContentChange = useCallback((html: string) => {
        // Re-enable manual save when content changes
        if (isManualSaveDisabled) {
            setIsManualSaveDisabled(false);
        }
        
        // Trigger debounced update
        debouncedUpdate(html);
    }, [debouncedUpdate, isManualSaveDisabled]);

    // Cleanup function to cancel pending operations
    const cancel = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    return { 
        debouncedUpdate: handleContentChange, 
        manualSave, 
        cancel, 
        isManualSaveDisabled 
    };
}

export default useDebounce;
