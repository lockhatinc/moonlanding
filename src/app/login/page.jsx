import { getUser } from '@/engine.server';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';
import { Center, Paper, Box, Title, Text, Code, ThemeIcon } from '@mantine/core';

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect('/');

  return (
    <Center mih="100vh" bg="gray.1">
      <Box w="100%" maw={400} p="md">
        <Paper shadow="md" p="xl" radius="md">
          <Box ta="center" mb="xl">
            <ThemeIcon size={48} radius="md" mb="md" mx="auto">
              <Text fw={700} size="xl">P</Text>
            </ThemeIcon>
            <Title order={2}>Welcome back</Title>
            <Text c="dimmed">Sign in to your account</Text>
          </Box>

          <LoginForm />

          <Box mt="xl" ta="center">
            <Text size="sm" c="dimmed">Demo credentials:</Text>
            <Code>admin@example.com / password</Code>
          </Box>
        </Paper>
      </Box>
    </Center>
  );
}

export const metadata = {
  title: 'Login',
};
