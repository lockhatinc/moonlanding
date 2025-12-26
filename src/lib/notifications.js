import { notifications } from '@mantine/notifications';

export function showSuccess(message, options = {}) {
  notifications.show({
    message,
    color: 'green',
    autoClose: 3000,
    ...options,
  });
}

export function showError(error, options = {}) {
  const message = error?.message || error || 'An error occurred';
  notifications.show({
    title: 'Error',
    message,
    color: 'red',
    autoClose: 5000,
    ...options,
  });
}

export function showInfo(message, options = {}) {
  notifications.show({
    message,
    color: 'blue',
    autoClose: 3000,
    ...options,
  });
}
