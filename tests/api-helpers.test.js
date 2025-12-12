/**
 * Tests for src/lib/api-helpers.js
 * Tests API response helpers and entity access wrappers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      data,
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

import {
  ok,
  created,
  notFound,
  badRequest,
  unauthorized,
  serverError,
  parseParams,
} from '../src/lib/api-helpers.js';

// ========================================
// RESPONSE HELPER TESTS
// ========================================

describe('ok', () => {
  it('should return 200 response with data', () => {
    const data = { id: '1', name: 'Test' };
    const response = ok(data);
    expect(NextResponse.json).toHaveBeenCalledWith(data);
    expect(response.status).toBe(200);
  });

  it('should handle array data', () => {
    const data = [{ id: '1' }, { id: '2' }];
    ok(data);
    expect(NextResponse.json).toHaveBeenCalledWith(data);
  });

  it('should handle empty object', () => {
    ok({});
    expect(NextResponse.json).toHaveBeenCalledWith({});
  });
});

describe('created', () => {
  it('should return 201 response with data', () => {
    const data = { id: '1', name: 'New Entity' };
    const response = created(data);
    expect(NextResponse.json).toHaveBeenCalledWith(data, { status: 201 });
    expect(response.status).toBe(201);
  });
});

describe('notFound', () => {
  it('should return 404 response with default message', () => {
    const response = notFound();
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Not found' }, { status: 404 });
    expect(response.status).toBe(404);
  });

  it('should return 404 response with custom message', () => {
    const response = notFound('Entity not found');
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Entity not found' }, { status: 404 });
  });
});

describe('badRequest', () => {
  it('should return 400 response with default message', () => {
    const response = badRequest();
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Bad request' }, { status: 400 });
    expect(response.status).toBe(400);
  });

  it('should return 400 response with custom message', () => {
    const response = badRequest('Missing required field');
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Missing required field' }, { status: 400 });
  });
});

describe('unauthorized', () => {
  it('should return 403 response with default message', () => {
    const response = unauthorized();
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 403 });
    expect(response.status).toBe(403);
  });

  it('should return 403 response with custom message', () => {
    const response = unauthorized('Permission denied');
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Permission denied' }, { status: 403 });
  });
});

describe('serverError', () => {
  it('should return 500 response with default message', () => {
    const response = serverError();
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' }, { status: 500 });
    expect(response.status).toBe(500);
  });

  it('should return 500 response with custom message', () => {
    const response = serverError('Database connection failed');
    expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Database connection failed' }, { status: 500 });
  });
});

// ========================================
// PARSE PARAMS TESTS
// ========================================

describe('parseParams', () => {
  it('should parse entity from params', async () => {
    const params = Promise.resolve({ entity: 'engagement', path: [] });
    const result = await parseParams(params);
    expect(result.entity).toBe('engagement');
  });

  it('should parse entity and id from path', async () => {
    const params = Promise.resolve({ entity: 'engagement', path: ['123'] });
    const result = await parseParams(params);
    expect(result.entity).toBe('engagement');
    expect(result.id).toBe('123');
  });

  it('should parse entity, id, and child key from path', async () => {
    const params = Promise.resolve({ entity: 'engagement', path: ['123', 'rfis'] });
    const result = await parseParams(params);
    expect(result.entity).toBe('engagement');
    expect(result.id).toBe('123');
    expect(result.childKey).toBe('rfis');
  });

  it('should handle missing path', async () => {
    const params = Promise.resolve({ entity: 'client' });
    const result = await parseParams(params);
    expect(result.entity).toBe('client');
    expect(result.id).toBeUndefined();
    expect(result.path).toEqual([]);
  });

  it('should include full path array', async () => {
    const params = Promise.resolve({ entity: 'review', path: ['abc', 'highlights', 'extra'] });
    const result = await parseParams(params);
    expect(result.path).toEqual(['abc', 'highlights', 'extra']);
  });
});

// ========================================
// RESPONSE STRUCTURE TESTS
// ========================================

describe('response structure', () => {
  it('should return consistent error format for all error responses', () => {
    const errorResponses = [
      notFound('test'),
      badRequest('test'),
      unauthorized('test'),
      serverError('test'),
    ];

    for (const response of errorResponses) {
      expect(response.data).toHaveProperty('error');
    }
  });

  it('should return data directly for success responses', () => {
    const successData = { id: '1', name: 'Test' };
    const response = ok(successData);
    expect(response.data).toEqual(successData);
  });
});
