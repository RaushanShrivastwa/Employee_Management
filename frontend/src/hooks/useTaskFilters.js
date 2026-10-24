import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    return {
      search: searchParams.get('search') || '',
      department: searchParams.get('department') || '',
      priority: searchParams.get('priority') || '',
      status: searchParams.get('status') || '',
      isOverdue: searchParams.get('isOverdue') || '',
      dueFrom: searchParams.get('dueFrom') || '',
      dueTo: searchParams.get('dueTo') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      order: searchParams.get('order') || 'desc',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '10', 10)
    };
  }, [searchParams]);

  // Update a single filter or multiple filters.
  // Rule: changing a filter resets page to 1.
  const setFilter = useCallback((key, value) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);

      if (value === '' || value === null || value === undefined) {
        updated.delete(key);
      } else {
        updated.set(key, String(value));
      }

      // If modifying any filter other than page, reset page to 1
      if (key !== 'page') {
        updated.set('page', '1');
      }

      return updated;
    }, { replace: true });
  }, [setSearchParams]);

  const setMultipleFilters = useCallback((updates) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) {
          updated.delete(key);
        } else {
          updated.set(key, String(value));
        }
      });

      if (!('page' in updates)) {
        updated.set('page', '1');
      }

      return updated;
    }, { replace: true });
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams({ page: '1', limit: '10' }), { replace: true });
  }, [setSearchParams]);

  return {
    filters,
    setFilter,
    setMultipleFilters,
    resetFilters,
    searchParams
  };
}
