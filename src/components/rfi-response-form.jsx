'use client';

import { useState, useEffect } from 'react';
import { Button, Textarea, FileInput, Stack, Text, Alert, Group, Progress } from '@mantine/core';

export function RFIResponseForm({ rfiId, engagementId, onSubmit, isClient }) {
  const [responseText, setResponseText] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const MAX_FILE_SIZE = 25 * 1024 * 1024;

  const handleFileChange = (selectedFiles) => {
    const filesArray = Array.isArray(selectedFiles) ? selectedFiles : [];
    const validFiles = filesArray.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        setFileError(`File ${f.name} exceeds 25MB limit`);
        return false;
      }
      return true;
    });
    setFileError('');
    setFiles(validFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUploadProgress(0);

    if (!responseText.trim() && files.length === 0) {
      setError('Response must include text or files');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('rfi_id', rfiId);
    formData.append('engagement_id', engagementId);
    formData.append('response_text', responseText);
    files.forEach((file) => formData.append('files', file));

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            setSuccess('Response submitted successfully');
            setResponseText('');
            setFiles([]);
            setUploadProgress(0);
            if (onSubmit) onSubmit(data);
            resolve();
          } catch (err) {
            setError('Failed to parse response');
            setLoading(false);
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setError(data.error || 'Failed to submit response');
          } catch {
            setError('Failed to submit response');
          }
          setLoading(false);
        }
      };

      xhr.onerror = () => {
        setError('Network error uploading response');
        setLoading(false);
      };

      xhr.open('POST', `/api/friday/rfi/${rfiId}/response`);
      xhr.send(formData);
    });
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
            error={fileError}
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

        {uploadProgress > 0 && uploadProgress < 100 && (
          <Progress value={uploadProgress} label={`${uploadProgress}%`} size="lg" />
        )}

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
