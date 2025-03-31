import { useState, useEffect } from 'react';

/**
 * A hook that debounces state updates to improve performance during rapid changes
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds before updating the debounced value
 * @returns A tuple with the debounced value and a function to update the value directly
 */
export function useDebounceValue<T>(initialValue: T, delay: number = 500): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    // Update debounced value after delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes or component unmounts
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return [debouncedValue, setValue];
} 