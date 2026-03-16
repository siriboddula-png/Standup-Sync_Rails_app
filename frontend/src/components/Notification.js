import React from 'react';

const Notification = ({ message, type = 'success', errors = [], onClose }) => {
  if (errors && errors.length > 0) {
    return (
      <div
        id="error_explanation"
        className="bg-red-50 border border-red-200 text-red-800 rounded-lg shadow-sm mb-3 text-left relative p-4"
        role="alert"
      >
        {onClose && (
          <button type="button" className="absolute top-2 right-2 text-red-800 hover:text-red-900" onClick={onClose} aria-label="Close">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <div className="flex items-center mb-2">
          <i className="bi bi-exclamation-triangle-fill mr-2"></i>
          <h6 className="font-bold mb-0 text-xs">
            {errors.length} {errors.length === 1 ? 'error' : 'errors'} prohibited this from being saved:
          </h6>
        </div>
        <ul className="mb-0 text-sm pl-5 ml-1">
          {errors.map((msg, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-red-600">•</span>
              <span>{msg}</span>
            </div>
          ))}
        </ul>
      </div>
    );
  }

  if (!message) return null;

  const alertConfig = {
    success: { bgClass: 'bg-green-50', borderClass: 'border-green-200', textClass: 'text-green-800', icon: 'bi-check-circle-fill' },
    error: { bgClass: 'bg-red-50', borderClass: 'border-red-200', textClass: 'text-red-800', icon: 'bi-exclamation-triangle-fill' },
    warning: { bgClass: 'bg-yellow-50', borderClass: 'border-yellow-200', textClass: 'text-yellow-800', icon: 'bi-exclamation-circle-fill' },
    info: { bgClass: 'bg-blue-50', borderClass: 'border-blue-200', textClass: 'text-blue-800', icon: 'bi-info-circle-fill' }
  };

  const config = alertConfig[type] || alertConfig.info;

  return (
    <div
      className={`${config.bgClass} border ${config.borderClass} ${config.textClass} rounded-lg shadow-sm mb-3 p-4 relative`}
      role="alert"
    >
      <div className="flex items-center">
        <i className={`bi ${config.icon} mr-2`}></i>
        <span>{message}</span>
      </div>
      {onClose && (
        <button type="button" className={`absolute top-2 right-2 ${config.textClass} hover:opacity-75`} onClick={onClose} aria-label="Close">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Notification;