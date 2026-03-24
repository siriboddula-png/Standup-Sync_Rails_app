import { useState, useEffect, useCallback } from 'react';
import API from '../api/axiosConfig';

export const useStandups = () => {
  const [standups, setStandups] = useState([]);
  const [searchInputs, setSearchInputs] = useState({
    search_name: '',
    search_date: ''
  });
  const [activeQuery, setActiveQuery] = useState({
    search_name: '',
    search_date: '',
    sort: 'desc'
  });

  const fetchStandups = useCallback(async () => {
    try {
      console.log(`[useStandups] fetchStandups called with query:`, activeQuery);
      const res = await API.get('/v1/standups', { params: activeQuery });
      console.log(`[useStandups] fetchStandups received ${res.data.length} standups`);
      setStandups(res.data);
      console.log(`[useStandups] setStandups called with ${res.data.length} items`);
    } catch (err) {
      console.error("[useStandups] Fetch failed", err);
    }
  }, [activeQuery]);

  useEffect(() => {
    fetchStandups();
  }, [fetchStandups]);

  const applyNameFilter = () => {
    setActiveQuery(prev => ({ ...prev, search_name: searchInputs.search_name }));
  };

  const applyDateFilter = () => {
    setActiveQuery(prev => ({ ...prev, search_date: searchInputs.search_date }));
  };

  const clearFilters = () => {
    setSearchInputs({ search_name: '', search_date: '' });
    setActiveQuery({ search_name: '', search_date: '', sort: 'desc' });
  };

  const toggleSort = () => {
    setActiveQuery(prev => ({ ...prev, sort: prev.sort === 'asc' ? 'desc' : 'asc' }));
  };

  const createStandup = async (formData, userId) => {
    await API.post('/v1/standups', { ...formData, user_id: userId });
    await fetchStandups();
  };

  const updateStandup = async (id, formData, userId) => {
    await API.put(`/v1/standups/${id}`, { ...formData, user_id: userId });
    await fetchStandups();
  };

  const deleteStandup = async (id, userId) => {
    console.log(`[useStandups] Deleting standup ${id} for user ${userId}`);
    const response = await API.delete(`/v1/standups/${id}?user_id=${userId}`);
    console.log(`[useStandups] Delete response:`, response.status, response.data);
    console.log(`[useStandups] Calling fetchStandups after delete...`);
    await fetchStandups();
    console.log(`[useStandups] fetchStandups completed, new standups count:`, standups.length);
  };

  return {
    standups,
    searchInputs,
    setSearchInputs,
    activeQuery,
    applyNameFilter,
    applyDateFilter,
    clearFilters,
    toggleSort,
    createStandup,
    updateStandup,
    deleteStandup,
    refetch: fetchStandups
  };
};

