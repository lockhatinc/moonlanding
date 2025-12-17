export const engagementWorkflow = {
  entity: 'engagement',
  stages: ['draft', 'planning', 'execution', 'review', 'closed'],
  initial: 'draft',
  transitions: {
    planning: {
      from: ['draft'],
      requires: ['manager', 'partner'],
      validation: ['hasBudget', 'hasTitle'],
      auto: null,
    },
    execution: {
      from: ['planning'],
      requires: ['manager', 'partner'],
      validation: ['hasTeam', 'hasStartDate'],
      auto: null,
    },
    review: {
      from: ['execution'],
      requires: ['partner'],
      validation: [],
      auto: null,
    },
    closed: {
      from: ['review'],
      requires: ['partner'],
      validation: [],
      auto: { afterDays: 30 },
    },
  },
};

export const rfiWorkflow = {
  entity: 'rfi',
  stages: ['pending', 'sent', 'responded', 'completed'],
  initial: 'pending',
  transitions: {
    sent: {
      from: ['pending'],
      requires: ['partner', 'manager'],
      validation: ['hasRecipient'],
      auto: null,
    },
    responded: {
      from: ['sent'],
      requires: ['partner', 'manager', 'auditor'],
      validation: [],
      auto: null,
    },
    completed: {
      from: ['responded'],
      requires: ['partner', 'manager'],
      validation: [],
      auto: { afterDays: 7 },
    },
  },
};

export const reviewWorkflow = {
  entity: 'review',
  stages: ['draft', 'in_progress', 'completed', 'approved'],
  initial: 'draft',
  transitions: {
    in_progress: {
      from: ['draft'],
      requires: ['auditor', 'partner'],
      validation: ['hasPdf'],
      auto: null,
    },
    completed: {
      from: ['in_progress'],
      requires: ['auditor'],
      validation: [],
      auto: null,
    },
    approved: {
      from: ['completed'],
      requires: ['partner'],
      validation: [],
      auto: null,
    },
  },
};
