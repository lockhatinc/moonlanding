import { PermissionService } from '@/services/permission.service';
import { ValidationService } from '@/services/validation.service';
import { EventService } from '@/services/event.service';
import { WorkflowService } from '@/services/workflow.service';
import { NotificationService } from '@/services/notification.service';
import { FileService } from '@/services/file.service';
import { EngagementService } from '@/services/engagement.service';

export function createPermissionService(cacheTTL = 3000) {
  return new PermissionService(cacheTTL);
}

export function createValidationService() {
  return new ValidationService();
}

export function createEventService() {
  return new EventService();
}

export function createWorkflowService() {
  return new WorkflowService();
}

export function createNotificationService() {
  return new NotificationService();
}

export function createFileService() {
  return new FileService();
}

export function createEngagementService() {
  return new EngagementService();
}

export const serviceFactories = {
  permission: createPermissionService,
  validation: createValidationService,
  event: createEventService,
  workflow: createWorkflowService,
  notification: createNotificationService,
  file: createFileService,
  engagement: createEngagementService,
};
