'use client';

import { useState } from 'react';
import { Button, Textarea, FileInput, Stack, Text, Alert } from '@mantine/core';

export function RFIResponseForm({ rfiId, engagementId, onSubmit, isClient }) {
  const [responseText, setResponseText] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setFiles(e.currentTarget.files ? Array.from(e.currentTarget.files) : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!responseText.trim() && files.length === 0) {
      setError('Response must include text or files');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('rfi_id', rfiId);
      formData.append('engagement_id', engagementId);
      formData.append('response_text', responseText);

      files.forEach((file) => formData.append('files', file));

      const res = await fetch(`/api/friday/rfi/${rfiId}/response`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit response');
      }

      setSuccess('Response submitted successfully');
      setResponseText('');
      setFiles([]);

      if (onSubmit) onSubmit(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rfi-response-form">
      <Stack gap="md">
        <div>
          <Text size="sm" fw={500} mb="xs">Response Text</Text>
          <Textarea
            placeholder="Enter your response here..."
            value={responseText}
            onChange={(e) => setResponseText(e.currentTarget.value)}
            minRows={4}
            disabled={loading}
          />
        </div>

        <div>
          <Text size="sm" fw={500} mb="xs">Attachments (Optional)</Text>
          <FileInput
            placeholder="Click to select files"
            icon={null}
            multiple
            onChange={handleFileChange}
            disabled={loading}
            accept="*"
          />
          {files.length > 0 && (
            <Text size="xs" mt="xs" c="dimmed">
              {files.length} file(s) selected
            </Text>
          )}
        </div>

        {error && <Alert color="red" title="Error">{error}</Alert>}
        {success && <Alert color="green" title="Success">{success}</Alert>}

        <Button
          type="submit"
          disabled={loading}
          loading={loading}
        >
          {loading ? 'Submitting...' : 'Submit Response'}
        </Button>
      </Stack>
    </form>
  );
}
