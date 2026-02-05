import React, { useState } from 'react';

export default function GenericWorkflowUI({ entity, entityId, currentStage, spec, onTransition }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getNextStages = () => {
    if (!spec?.workflow?.stages) return [];
    const currentStageConfig = spec.workflow.stages.find(
      s => (typeof s === 'string' ? s : s.name) === currentStage
    );
    if (!currentStageConfig) return [];
    const stageName = typeof currentStageConfig === 'string' ? currentStageConfig : currentStageConfig.name;
    const stageObj = typeof currentStageConfig === 'object' ? currentStageConfig : { name: stageName };
    return stageObj.forward || [];
  };

  const handleTransition = async (nextStage) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/${entity}/${entityId}?action=transition_stage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_stage: nextStage }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Transition failed');
      }
      if (onTransition) {
        const data = await response.json();
        onTransition(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStages = getNextStages();

  if (!nextStages.length) {
    return null;
  }

  return (
    <div className="generic-workflow-ui">
      <div className="workflow-transitions">
        <label>Next Stage:</label>
        <div className="transition-buttons">
          {nextStages.map((stage) => (
            <button
              key={stage}
              onClick={() => handleTransition(stage)}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Transitioning...' : stage}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
