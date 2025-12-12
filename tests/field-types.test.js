/**
 * Tests for src/lib/field-types.js
 * Tests field type coercion, formatting, and helper functions
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  SQL_TYPES,
  coerce,
  formatDate,
  parseDate,
  BADGE_COLORS,
  getEnumOption,
  getEnumOptions,
  formatDisplayValue,
  formatFormValue,
  getListFields,
  getFormFields,
  getDisplayFields,
  getSearchFields,
  getFormSections,
} from '../src/lib/field-types.js';

// ========================================
// SQL_TYPES TESTS
// ========================================

describe('SQL_TYPES', () => {
  it('should map id type to TEXT PRIMARY KEY', () => {
    expect(SQL_TYPES.id).toBe('TEXT PRIMARY KEY');
  });

  it('should map text types to TEXT', () => {
    expect(SQL_TYPES.text).toBe('TEXT');
    expect(SQL_TYPES.textarea).toBe('TEXT');
    expect(SQL_TYPES.email).toBe('TEXT');
  });

  it('should map numeric types correctly', () => {
    expect(SQL_TYPES.int).toBe('INTEGER');
    expect(SQL_TYPES.decimal).toBe('REAL');
    expect(SQL_TYPES.bool).toBe('INTEGER');
  });

  it('should map date types to INTEGER (unix timestamps)', () => {
    expect(SQL_TYPES.date).toBe('INTEGER');
    expect(SQL_TYPES.timestamp).toBe('INTEGER');
  });

  it('should map json to TEXT', () => {
    expect(SQL_TYPES.json).toBe('TEXT');
  });

  it('should map ref and enum to TEXT', () => {
    expect(SQL_TYPES.ref).toBe('TEXT');
    expect(SQL_TYPES.enum).toBe('TEXT');
  });

  it('should have all documented field types', () => {
    const expectedTypes = ['id', 'text', 'textarea', 'email', 'int', 'decimal', 'bool', 'date', 'timestamp', 'json', 'image', 'ref', 'enum'];
    for (const type of expectedTypes) {
      expect(SQL_TYPES).toHaveProperty(type);
    }
  });
});

// ========================================
// COERCE FUNCTION TESTS
// ========================================

describe('coerce', () => {
  describe('undefined and empty handling', () => {
    it('should return undefined for undefined value (non-bool)', () => {
      expect(coerce(undefined, 'text')).toBeUndefined();
      expect(coerce(undefined, 'int')).toBeUndefined();
    });

    it('should return 0 for undefined bool value', () => {
      expect(coerce(undefined, 'bool')).toBe(0);
    });

    it('should return null for empty string (non-bool)', () => {
      expect(coerce('', 'text')).toBeNull();
      expect(coerce('', 'int')).toBeNull();
    });

    it('should return 0 for empty string bool value', () => {
      expect(coerce('', 'bool')).toBe(0);
    });
  });

  describe('json coercion', () => {
    it('should pass through string JSON', () => {
      const json = '{"key": "value"}';
      expect(coerce(json, 'json')).toBe(json);
    });

    it('should stringify object to JSON', () => {
      const obj = { key: 'value' };
      expect(coerce(obj, 'json')).toBe('{"key":"value"}');
    });

    it('should stringify array to JSON', () => {
      const arr = [1, 2, 3];
      expect(coerce(arr, 'json')).toBe('[1,2,3]');
    });
  });

  describe('bool coercion', () => {
    it('should return 1 for truthy values', () => {
      expect(coerce(true, 'bool')).toBe(1);
      expect(coerce('true', 'bool')).toBe(1);
      expect(coerce('on', 'bool')).toBe(1);
      expect(coerce(1, 'bool')).toBe(1);
    });

    it('should return 0 for falsy values', () => {
      expect(coerce(false, 'bool')).toBe(0);
      expect(coerce('false', 'bool')).toBe(0);
      expect(coerce('off', 'bool')).toBe(0);
      expect(coerce(0, 'bool')).toBe(0);
    });
  });

  describe('int coercion', () => {
    it('should parse integer strings', () => {
      expect(coerce('42', 'int')).toBe(42);
      expect(coerce('-10', 'int')).toBe(-10);
    });

    it('should return 0 for non-numeric strings', () => {
      expect(coerce('abc', 'int')).toBe(0);
    });

    it('should pass through integers', () => {
      expect(coerce(42, 'int')).toBe(42);
    });

    it('should truncate floats to integers', () => {
      expect(coerce('42.7', 'int')).toBe(42);
    });
  });

  describe('decimal coercion', () => {
    it('should parse float strings', () => {
      expect(coerce('42.5', 'decimal')).toBe(42.5);
      expect(coerce('-10.25', 'decimal')).toBe(-10.25);
    });

    it('should return 0 for non-numeric strings', () => {
      expect(coerce('abc', 'decimal')).toBe(0);
    });

    it('should pass through numbers', () => {
      expect(coerce(42.5, 'decimal')).toBe(42.5);
    });
  });

  describe('date/timestamp coercion', () => {
    it('should convert ISO date string to unix timestamp', () => {
      const result = coerce('2024-01-15', 'date');
      expect(result).toBeTypeOf('number');
      expect(result).toBe(Math.floor(new Date('2024-01-15').getTime() / 1000));
    });

    it('should convert datetime string to unix timestamp', () => {
      const result = coerce('2024-01-15T10:30:00', 'timestamp');
      expect(result).toBeTypeOf('number');
    });

    it('should pass through unix timestamps', () => {
      const timestamp = 1705312800;
      expect(coerce(timestamp, 'date')).toBe(timestamp);
    });
  });

  describe('default passthrough', () => {
    it('should pass through text values unchanged', () => {
      expect(coerce('hello', 'text')).toBe('hello');
      expect(coerce('test@example.com', 'email')).toBe('test@example.com');
    });

    it('should pass through unknown types', () => {
      expect(coerce('value', 'unknown_type')).toBe('value');
    });
  });
});

// ========================================
// DATE FORMATTING TESTS
// ========================================

describe('formatDate', () => {
  const timestamp = 1705312800; // 2024-01-15 10:00:00 UTC

  it('should return null for null/undefined', () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate(undefined)).toBeNull();
  });

  it('should return null for invalid dates', () => {
    expect(formatDate('invalid')).toBeNull();
  });

  it('should format as ISO date', () => {
    const result = formatDate(timestamp, 'iso');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should format as locale date by default', () => {
    const result = formatDate(timestamp);
    expect(result).toBeTruthy();
    expect(result).toBeTypeOf('string');
  });

  it('should format as datetime', () => {
    const result = formatDate(timestamp, 'datetime');
    expect(result).toBeTruthy();
    expect(result).toBeTypeOf('string');
  });

  it('should format as time only', () => {
    const result = formatDate(timestamp, 'time');
    expect(result).toBeTruthy();
    expect(result).toBeTypeOf('string');
  });

  it('should handle Date objects', () => {
    const date = new Date(timestamp * 1000);
    const result = formatDate(date);
    expect(result).toBeTruthy();
  });
});

describe('parseDate', () => {
  it('should return null for null/undefined', () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate(undefined)).toBeNull();
  });

  it('should return null for invalid dates', () => {
    expect(parseDate('invalid')).toBeNull();
  });

  it('should parse ISO date string to timestamp', () => {
    const result = parseDate('2024-01-15');
    expect(result).toBeTypeOf('number');
    expect(result).toBe(Math.floor(new Date('2024-01-15').getTime() / 1000));
  });

  it('should parse datetime string to timestamp', () => {
    const result = parseDate('2024-01-15T10:30:00Z');
    expect(result).toBeTypeOf('number');
  });
});

// ========================================
// BADGE COLORS TESTS
// ========================================

describe('BADGE_COLORS', () => {
  it('should have all standard colors', () => {
    expect(BADGE_COLORS).toHaveProperty('green');
    expect(BADGE_COLORS).toHaveProperty('yellow');
    expect(BADGE_COLORS).toHaveProperty('amber');
    expect(BADGE_COLORS).toHaveProperty('blue');
    expect(BADGE_COLORS).toHaveProperty('gray');
    expect(BADGE_COLORS).toHaveProperty('red');
  });

  it('should map amber to orange', () => {
    expect(BADGE_COLORS.amber).toBe('orange');
  });
});

// ========================================
// ENUM HELPERS TESTS
// ========================================

describe('getEnumOption', () => {
  const mockSpec = {
    options: {
      statuses: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'inactive', label: 'Inactive', color: 'gray' },
      ],
    },
  };

  it('should find option by value', () => {
    const option = getEnumOption(mockSpec, 'statuses', 'active');
    expect(option).toEqual({ value: 'active', label: 'Active', color: 'green' });
  });

  it('should return undefined for non-existent value', () => {
    const option = getEnumOption(mockSpec, 'statuses', 'nonexistent');
    expect(option).toBeUndefined();
  });

  it('should handle string/number value matching', () => {
    const specWithNumbers = {
      options: {
        stages: [{ value: 1, label: 'Stage 1' }],
      },
    };
    expect(getEnumOption(specWithNumbers, 'stages', '1')).toBeTruthy();
    expect(getEnumOption(specWithNumbers, 'stages', 1)).toBeTruthy();
  });

  it('should return undefined for missing options key', () => {
    const option = getEnumOption(mockSpec, 'nonexistent', 'value');
    expect(option).toBeUndefined();
  });
});

describe('getEnumOptions', () => {
  const mockSpec = {
    options: {
      statuses: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  };

  it('should return all options for key', () => {
    const options = getEnumOptions(mockSpec, 'statuses');
    expect(options).toHaveLength(2);
  });

  it('should return empty array for missing key', () => {
    const options = getEnumOptions(mockSpec, 'nonexistent');
    expect(options).toEqual([]);
  });
});

// ========================================
// DISPLAY VALUE FORMATTING TESTS
// ========================================

describe('formatDisplayValue', () => {
  const mockSpec = {
    options: {
      statuses: [
        { value: 'active', label: 'Active', color: 'green' },
        { value: 'pending', label: 'Pending', color: 'yellow' },
      ],
    },
  };

  it('should return null for null/undefined values', () => {
    expect(formatDisplayValue(null, {}, {})).toBeNull();
    expect(formatDisplayValue(undefined, {}, {})).toBeNull();
    expect(formatDisplayValue('', {}, {})).toBeNull();
  });

  describe('enum formatting', () => {
    it('should format enum as badge-like object', () => {
      const result = formatDisplayValue('active', { type: 'enum', options: 'statuses' }, mockSpec);
      expect(result).toEqual({ label: 'Active', color: 'green' });
    });

    it('should return raw value if enum option not found', () => {
      const result = formatDisplayValue('unknown', { type: 'enum', options: 'statuses' }, mockSpec);
      expect(result).toBe('unknown');
    });
  });

  describe('ref formatting', () => {
    it('should return display value from row for refs', () => {
      const row = { client_id_display: 'Acme Corp' };
      const result = formatDisplayValue('abc123', { type: 'ref', key: 'client_id' }, {}, row);
      expect(result).toBe('Acme Corp');
    });

    it('should return avatar object for avatar display', () => {
      const users = [{ id: '1', name: 'John' }];
      const result = formatDisplayValue(users, { type: 'ref', display: 'avatars' }, {});
      expect(result).toEqual({ type: 'avatars', users });
    });
  });

  describe('date formatting', () => {
    it('should format timestamp values', () => {
      const result = formatDisplayValue(1705312800, { type: 'timestamp' }, {});
      expect(result).toBeTruthy();
      expect(result).toBeTypeOf('string');
    });

    it('should format date values', () => {
      const result = formatDisplayValue(1705312800, { type: 'date' }, {});
      expect(result).toBeTruthy();
    });
  });

  describe('bool formatting', () => {
    it('should format true as Yes', () => {
      expect(formatDisplayValue(1, { type: 'bool' }, {})).toBe('Yes');
      expect(formatDisplayValue(true, { type: 'bool' }, {})).toBe('Yes');
    });

    it('should format false as No', () => {
      expect(formatDisplayValue(0, { type: 'bool' }, {})).toBe('No');
      expect(formatDisplayValue(false, { type: 'bool' }, {})).toBe('No');
    });
  });

  describe('json formatting', () => {
    it('should truncate long JSON', () => {
      const longJson = JSON.stringify({ key: 'a'.repeat(100) });
      const result = formatDisplayValue(longJson, { type: 'json' }, {});
      expect(result).toContain('...');
      expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
    });

    it('should stringify object JSON', () => {
      const obj = { key: 'value' };
      const result = formatDisplayValue(obj, { type: 'json' }, {});
      expect(result).toContain('key');
    });
  });

  describe('decimal formatting', () => {
    it('should format decimal to 2 places', () => {
      expect(formatDisplayValue(42.123, { type: 'decimal' }, {})).toBe('42.12');
      expect(formatDisplayValue(10, { type: 'decimal' }, {})).toBe('10.00');
    });
  });

  describe('textarea formatting', () => {
    it('should truncate long text', () => {
      const longText = 'a'.repeat(200);
      const result = formatDisplayValue(longText, { type: 'textarea' }, {});
      expect(result).toContain('...');
      expect(result.length).toBeLessThanOrEqual(103);
    });
  });

  describe('default formatting', () => {
    it('should convert values to string', () => {
      expect(formatDisplayValue(42, { type: 'text' }, {})).toBe('42');
      expect(formatDisplayValue('hello', { type: 'text' }, {})).toBe('hello');
    });
  });
});

// ========================================
// FORM VALUE FORMATTING TESTS
// ========================================

describe('formatFormValue', () => {
  it('should return empty string for null/undefined', () => {
    expect(formatFormValue(null, 'text')).toBe('');
    expect(formatFormValue(undefined, 'text')).toBe('');
  });

  it('should format date as ISO string', () => {
    const result = formatFormValue(1705312800, 'date');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should format bool as boolean', () => {
    expect(formatFormValue(1, 'bool')).toBe(true);
    expect(formatFormValue(0, 'bool')).toBe(false);
  });

  it('should pass through other types', () => {
    expect(formatFormValue('hello', 'text')).toBe('hello');
    expect(formatFormValue(42, 'int')).toBe(42);
  });
});

// ========================================
// FIELD FILTERING HELPERS TESTS
// ========================================

describe('field filtering helpers', () => {
  const mockSpec = {
    fields: {
      id: { type: 'id' },
      name: { type: 'text', list: true, search: true },
      email: { type: 'email', list: true, search: true },
      status: { type: 'enum', list: true, hidden: false },
      password: { type: 'text', hidden: true },
      created_at: { type: 'timestamp', readOnly: true },
      description: { type: 'textarea' },
    },
  };

  describe('getListFields', () => {
    it('should return only fields with list: true', () => {
      const fields = getListFields(mockSpec);
      expect(fields.map(f => f.key)).toEqual(['name', 'email', 'status']);
    });

    it('should include field metadata', () => {
      const fields = getListFields(mockSpec);
      const nameField = fields.find(f => f.key === 'name');
      expect(nameField.type).toBe('text');
      expect(nameField.search).toBe(true);
    });
  });

  describe('getFormFields', () => {
    it('should exclude hidden, readOnly, and id fields', () => {
      const fields = getFormFields(mockSpec);
      const keys = fields.map(f => f.key);
      expect(keys).not.toContain('id');
      expect(keys).not.toContain('password'); // hidden
      expect(keys).not.toContain('created_at'); // readOnly
      expect(keys).toContain('name');
      expect(keys).toContain('description');
    });
  });

  describe('getDisplayFields', () => {
    it('should exclude only hidden and id fields', () => {
      const fields = getDisplayFields(mockSpec);
      const keys = fields.map(f => f.key);
      expect(keys).not.toContain('id');
      expect(keys).not.toContain('password'); // hidden
      expect(keys).toContain('created_at'); // readOnly is OK for display
      expect(keys).toContain('name');
    });
  });

  describe('getSearchFields', () => {
    it('should return only field keys with search: true', () => {
      const fields = getSearchFields(mockSpec);
      expect(fields).toEqual(['name', 'email']);
    });
  });
});

// ========================================
// FORM SECTIONS TESTS
// ========================================

describe('getFormSections', () => {
  it('should use explicit sections if defined', () => {
    const spec = {
      fields: { name: { type: 'text' } },
      form: {
        sections: [{ label: 'Custom', fields: ['name'] }],
      },
    };
    const sections = getFormSections(spec);
    expect(sections).toEqual([{ label: 'Custom', fields: ['name'] }]);
  });

  it('should auto-generate sections from field groups', () => {
    const spec = {
      fields: {
        id: { type: 'id' },
        name: { type: 'text', group: 'Basic Info' },
        email: { type: 'email', group: 'Basic Info' },
        deadline: { type: 'date', group: 'Dates' },
        fee: { type: 'decimal', group: 'Financial' },
      },
    };
    const sections = getFormSections(spec);
    expect(sections.some(s => s.label === 'Basic Info')).toBe(true);
    expect(sections.some(s => s.label === 'Dates')).toBe(true);
    expect(sections.some(s => s.label === 'Financial')).toBe(true);
  });

  it('should infer groups from field name patterns', () => {
    const spec = {
      fields: {
        id: { type: 'id' },
        name: { type: 'text' },
        deadline: { type: 'date' },
        is_private: { type: 'bool' },
        fee: { type: 'decimal' },
      },
    };
    const sections = getFormSections(spec);
    // Should have inferred groups based on patterns
    expect(sections.length).toBeGreaterThan(0);
  });
});
