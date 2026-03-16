import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useStandups } from '../hooks/useStandups';
import { getTodayDate } from '../utils/standupHelpers';
import Header from './dashboard/DashboardHeader';
import FilterBar from './dashboard/FilterBar';
import StandupFormView from './dashboard/StandupFormView';
import TeamView from './dashboard/TeamView';
import ProfileView from './dashboard/ProfileView';
import StandupViewPage from './dashboard/StandupViewPage';
import Notification from './Notification';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '', errors: [] });
  const [formData, setFormData] = useState({
    done: '',
    doing: '',
    blockers: '',
    standup_date: getTodayDate()
  });

  const {
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
    deleteStandup
  } = useStandups();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateStandupForm();
    if (validationErrors.length > 0) {
      setNotification({ message: '', type: 'error', errors: validationErrors });
      return;
    }

    try {
      if (editingId) {
        await updateStandup(editingId, formData);
        setEditingId(null);
        showNotification("Standup edited successfully!", "success");
      } else {
        await createStandup(formData, user.id);
        showNotification("Standup saved successfully!", "success");
      }
      resetForm();
      navigate('/dashboard');
    } catch (err) {
      console.error("Save error:", err);

      if (err.response?.data?.errors) {
        const apiErrors = Array.isArray(err.response.data.errors)
        ? err.response.data.errors : [err.response.data.errors];
        setNotification({ message: '', type: 'error', errors: apiErrors });
      } else {
        showNotification("Save failed. Please check your entries and try again.", "error");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this log?")) {
      try {
        await deleteStandup(id);
        showNotification("Standup deleted successfully!","success");
      } catch (err) {
        showNotification("Delete failed.","error");
      }
    }
  };

  const handleEdit = (standup) => {
    setFormData({
      done: standup.done,
      doing: standup.doing,
      blockers: standup.blockers || '',
      standup_date: standup.standup_date
    });
    setEditingId(standup.id);
    navigate('/dashboard/new');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, errors: [] });
    setTimeout(() => setNotification({ message: '', type: '', errors: [] }), 5000);
  };

  const validateStandupForm = () => {
    const errors = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.standup_date);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      errors.push('Standup date cannot be in the future. Please select today or a previous date.');
    }
    if (!formData.done || formData.done.trim().length === 0) {
      errors.push('Accomplished tasks cannot be empty.');
    } else if (formData.done.trim().length < 15) {
      errors.push(`Accomplished tasks must be at least 15 characters long (currently ${formData.done.trim().length} characters).`);
    }
    if (!formData.doing || formData.doing.trim().length === 0) {
      errors.push('Tasks in progress cannot be empty.');
    } else if (formData.doing.trim().length < 15) {
      errors.push(`Tasks in progress must be at least 15 characters long (currently ${formData.doing.trim().length} characters).`);
    }
    if (formData.blockers && formData.blockers.trim().length > 200) {
      errors.push(`Blockers must be 200 characters or less (currently ${formData.blockers.trim().length} characters).`);
    }

    return errors;
  };

  const resetForm = () => {
    setFormData({ done: '', doing: '', blockers: '', standup_date: getTodayDate() });
    setEditingId(null);
  };

  const handleViewChange = (newView) => {
    if (newView === 'new') {
      resetForm();
      navigate('/dashboard/new');
    } else if (newView === 'profile') {
      navigate('/dashboard/profile');
    } else {
      navigate('/dashboard');
    }
  };

  const myStandups = standups.filter(s => Number(s.user_id) === Number(user.id));

  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      <Notification
        message={notification.message}
        type={notification.type}
        errors={notification.errors}
        onClose={() => setNotification({ message: '', type: '', errors: [] })}
      />

      <Routes>
        <Route path="/" element={
          <>
            <Header
              view="team"
              user={user}
              standups={standups}
              onViewChange={handleViewChange}
              onLogout={onLogout}
            />
            <FilterBar
              searchInputs={searchInputs}
              setSearchInputs={setSearchInputs}
              activeQuery={activeQuery}
              onApplyNameFilter={applyNameFilter}
              onApplyDateFilter={applyDateFilter}
              onClearFilters={clearFilters}
              onToggleSort={toggleSort}
            />
            <TeamView
              standups={standups}
              currentUserId={user.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        } />

        <Route path="/new" element={
          <>
            <Header
              view="new"
              user={user}
              standups={standups}
              onViewChange={handleViewChange}
              onLogout={onLogout}
            />
            <StandupFormView
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/dashboard')}
              isEditing={!!editingId}
            />
          </>
        } />

        <Route path="/profile" element={
          <>
            <Header
              view="profile"
              user={user}
              standups={standups}
              onViewChange={handleViewChange}
              onLogout={onLogout}
            />
            <ProfileView
              standups={myStandups}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateNew={() => navigate('/dashboard/new')}
            />
          </>
        } />

        <Route path="/v1/:id" element={<StandupViewPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default Dashboard;