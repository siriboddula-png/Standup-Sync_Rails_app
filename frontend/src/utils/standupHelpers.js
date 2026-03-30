// Utility functions for standup operations

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

export const formatShortDate = () => {
  return new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const hasBlocker = (blockers) => {
  if (!blockers) return false;
  const normalized = blockers.toLowerCase().trim();
  return !["-", "none", "nil", ""].includes(normalized);
};

export const groupByDate = (standups) => {
  const grouped = standups.reduce((groups, standup) => {
    const date = standup.standup_date || 'Unscheduled';
    if (!groups[date]) groups[date] = [];
    groups[date].push(standup);
    return groups;
  }, {});
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  });
  return grouped;
};

export const countRecentBlockers = (standups) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return standups.filter(s => {
    const standupDate = new Date(s.standup_date);
    return hasBlocker(s.blockers) && standupDate >= sevenDaysAgo;
  }).length;
};

export const getUserName = (standup) => {
  return standup.user 
    ? `${standup.user.first_name} ${standup.user.last_name}` 
    : standup.name;
};

