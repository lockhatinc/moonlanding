'use client';

import { useFormStatus } from 'react-dom';
import { Button, TextInput, PasswordInput, Alert, Stack } from '@mantine/core';
import { AlertCircle } from 'lucide-react';
import { loginAction } from './actions';
import { useState } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth loading={pending}>
      Sign in
    </Button>
  );
}

export function LoginForm() {
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
    }
  };

  return (
    <form action={handleSubmit}>
      <Stack gap="md">
        {error && (
          <Alert color="red" icon={<AlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        <TextInput
          name="email"
          type="email"
          label="Email"
          placeholder="Enter your email"
          required
        />

        <PasswordInput
          name="password"
          label="Password"
          placeholder="Enter your password"
          required
        />

        <SubmitButton />
      </Stack>
    </form>
  );
}
