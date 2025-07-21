import { useRef } from 'react';

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

export default useDebounce;
