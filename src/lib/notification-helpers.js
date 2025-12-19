import { notifications } from '@mantine/notifications';

export const showNotification = {
  success: (message, title = 'Success', autoClose = 3000) =>
    notifications.show({
      title,
      message,
      color: 'green',
      autoClose,
    }),

  error: (message, title = 'Error', autoClose = 5000) =>
    notifications.show({
      title,
      message,
      color: 'red',
      autoClose,
    }),

  warning: (message, title = 'Warning', autoClose = 4000) =>
    notifications.show({
      title,
      message,
      color: 'yellow',
      autoClose,
    }),

  info: (message, title = 'Info', autoClose = 3000) =>
    notifications.show({
      title,
      message,
      color: 'blue',
      autoClose,
    }),

  loading: (message, title = 'Processing') =>
    notifications.show({
      title,
      message,
      color: 'cyan',
      loading: true,
      autoClose: false,
    }),
};
