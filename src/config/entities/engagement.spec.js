import { spec } from '../spec-builder.js';

export const engagementSpec = spec('engagement')
  .label('Engagement', 'Engagements')
  .icon('Briefcase')
  .order(2)
  .fields({
    client_id: { type: 'ref', ref: 'client', display: 'client.name', required: true, list: true },
    year: { type: 'int', required: true, list: true },
    status: { type: 'enum', options: 'engagement_status', required: true, list: true, default: 'pending' },
    stage: { type: 'enum', options: 'engagement_stage', required: true, list: true, default: 'info_gathering' },
    title: { type: 'text', required: true, list: true, search: true },
    description: { type: 'textarea' },
    start_date: { type: 'date' },
    end_date: { type: 'date' },
  })
  .options('engagement_status', {
    pending: { label: 'Pending', color: 'yellow' },
    active: { label: 'Active', color: 'blue' },
    completed: { label: 'Completed', color: 'green' },
    archived: { label: 'Archived', color: 'gray' },
  })
  .options('engagement_stage', {
    info_gathering: { label: 'Info Gathering', color: 'blue' },
    commencement: { label: 'Commencement', color: 'blue' },
    team_execution: { label: 'Team Execution', color: 'amber' },
    partner_review: { label: 'Partner Review', color: 'amber' },
    finalization: { label: 'Finalization', color: 'green' },
    close_out: { label: 'Close Out', color: 'green' },
  })
  .children({
    reviews: {
      entity: 'review',
      label: 'Reviews',
      fk: 'engagement_id',
    },
    rfis: {
      entity: 'rfi',
      label: 'RFIs',
      fk: 'engagement_id',
    },
  })
  .list({ groupBy: 'status', defaultSort: { field: 'created_at', dir: 'desc' } })
  .build();
