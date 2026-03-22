import { useState, useEffect } from 'preact/hooks';

export function useLocalStorageState<T>(key: string, defaultValue: T): [T, (value: T | ((prevState: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        const parsedValue = JSON.parse(storedValue);
        // If both defaultValue and parsedValue are non-array objects, merge them.
        // This ensures new keys in defaultValue are added to the state.
        if (
          typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue) &&
          typeof parsedValue === 'object' && parsedValue !== null && !Array.isArray(parsedValue)
        ) {
          return { ...defaultValue, ...parsedValue };
        }
        return parsedValue;
      }
      return defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [key, state]);

  return [state, setState];
}
