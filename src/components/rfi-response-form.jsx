'use client';

import { useState } from 'react';
import { Button, Textarea, FileInput, Stack, Text, Alert, Group } from '@mantine/core';

export function RFIResponseForm({ rfiId, engagementId, onSubmit, isClient }) {
  const [responseText, setResponseText] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const MAX_FILE_SIZE = 25 * 1024 * 1024;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.currentTarget.files || []);
    const validFiles = selectedFiles.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        setError(`File ${f.name} exceeds 25MB limit`);
        return false;
      }
      return true;
    });
    setFiles(validFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
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

      setTimeout(() => setSuccess(''), 3000);

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
            maxLength={5000}
            disabled={loading}
            description={`${responseText.length}/5000 characters`}
          />
        </div>

        <div>
          <Text size="sm" fw={500} mb="xs">Attachments (Optional)</Text>
          <FileInput
            placeholder="Click to select files (Max 25MB per file)"
            icon={null}
            multiple
            onChange={handleFileChange}
            disabled={loading}
            accept="*"
          />
          {files.length > 0 && (
            <Stack gap="xs" mt="xs">
              {files.map((file, i) => (
                <Group key={i} justify="space-between" p="xs" style={{ backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <Text size="sm">{file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</Text>
                  <Button size="xs" color="red" onClick={() => removeFile(i)}>
                    Remove
                  </Button>
                </Group>
              ))}
            </Stack>
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
