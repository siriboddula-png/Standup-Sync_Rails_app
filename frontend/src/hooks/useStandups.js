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
      const res = await API.get('/v1/standups', { params: activeQuery });
      setStandups(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
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

  const updateStandup = async (id, formData) => {
    await API.put(`/v1/standups/${id}`, formData);
    await fetchStandups();
  };

  const deleteStandup = async (id) => {
    await API.delete(`/v1/standups/${id}`);
    await fetchStandups();
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

