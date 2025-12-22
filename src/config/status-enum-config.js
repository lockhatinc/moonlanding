export const STATUS_ENUMS = {
  engagement: {
    values: ['pending', 'active', 'completed', 'cancelled', 'on_hold'],
    colors: {
      pending: 'yellow',
      active: 'blue',
      completed: 'green',
      cancelled: 'red',
      on_hold: 'gray',
    },
    labels: {
      pending: 'Pending',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      on_hold: 'On Hold',
    },
  },

  review: {
    values: ['draft', 'in_progress', 'completed'],
    colors: {
      draft: 'gray',
      in_progress: 'blue',
      completed: 'green',
    },
    labels: {
      draft: 'Draft',
      in_progress: 'In Progress',
      completed: 'Completed',
    },
  },

  highlight: {
    values: ['pending', 'resolved', 'rejected'],
    colors: {
      pending: 'yellow',
      resolved: 'green',
      rejected: 'red',
    },
    labels: {
      pending: 'Pending',
      resolved: 'Resolved',
      rejected: 'Rejected',
    },
  },

  rfi: {
    values: ['pending', 'submitted', 'resolved', 'rejected'],
    colors: {
      pending: 'yellow',
      submitted: 'blue',
      resolved: 'green',
      rejected: 'red',
    },
    labels: {
      pending: 'Pending',
      submitted: 'Submitted',
      resolved: 'Resolved',
      rejected: 'Rejected',
    },
  },
};

export function getStatusValues(entityType) {
  return STATUS_ENUMS[entityType]?.values || [];
}

export function getEnumStatusColor(entityType, status) {
  return STATUS_ENUMS[entityType]?.colors?.[status] || 'gray';
}

export function getStatusLabel(entityType, status) {
  return STATUS_ENUMS[entityType]?.labels?.[status] || status;
}

export function getStatusOptions(entityType) {
  const values = getStatusValues(entityType);
  return values.map(status => ({
    value: status,
    label: getStatusLabel(entityType, status),
    color: getEnumStatusColor(entityType, status),
  }));
}

export function isValidStatus(entityType, status) {
  return getStatusValues(entityType).includes(status);
}
