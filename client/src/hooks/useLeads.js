import { useState, useEffect, useCallback } from 'react';
import { leadsApi } from '../api/leadsApi';

/**
 * Custom hook that manages leads state, fetching, CRUD operations and filters.
 */
export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  const fetchLeads = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const result = await leadsApi.getAll(params);
      setLeads(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(filters);
  }, [filters, fetchLeads]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // Reset to page 1 on filter changes (not on pagination)
      page: key !== 'page' ? 1 : value,
    }));
  }, []);

  const setFilterBatch = useCallback((updates) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
      page: 1,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      search: '',
      status: '',
      source: '',
      page: 1,
    }));
  }, []);

  const setSort = useCallback((sortBy) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }, []);

  const createLead = useCallback(async (data) => {
    const newLead = await leadsApi.create(data);
    fetchLeads(filters);
    return newLead;
  }, [filters, fetchLeads]);

  const updateLead = useCallback(async (id, data) => {
    const updated = await leadsApi.update(id, data);
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    return updated;
  }, []);

  const deleteLead = useCallback(async (id) => {
    await leadsApi.delete(id);
    fetchLeads(filters);
  }, [filters, fetchLeads]);

  return {
    leads,
    pagination,
    loading,
    error,
    filters,
    updateFilter,
    setFilterBatch,
    resetFilters,
    setSort,
    createLead,
    updateLead,
    deleteLead,
    refresh: () => fetchLeads(filters),
  };
}
