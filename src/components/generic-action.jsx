import React, { useState } from 'react';

export default function GenericAction({ entity, entityId, action, label, onSuccess, spec }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAction = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/${entity}/${entityId}?action=${action}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Action failed: ${action}`);
      }
      if (onSuccess) {
        const data = await response.json();
        onSuccess(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="generic-action">
      <button
        onClick={handleAction}
        disabled={isLoading}
        className="btn btn-primary"
      >
        {isLoading ? 'Loading...' : label || action}
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
