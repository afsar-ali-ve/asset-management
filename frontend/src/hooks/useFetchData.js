import { useState, useCallback, useEffect } from 'react';
export function useFetchData(fetchFn, options = {}) {
    const { onSuccess, onError, autoFetch = true } = options;
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchFn();
            setData(response.data);
            onSuccess?.();
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            console.error('Data fetch error:', err);
            onError?.(err instanceof Error ? err : new Error(errorMessage));
        }
        finally {
            setLoading(false);
        }
    }, [fetchFn, onSuccess, onError]);
    useEffect(() => {
        if (autoFetch) {
            fetch();
        }
    }, [autoFetch, fetch]);
    return { data, loading, error, fetch };
}
