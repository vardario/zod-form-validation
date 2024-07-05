import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { flattenObject, flattenSchema, formDataToObject, objectToFormData, parseFormData } from '../utils.js';
import { EXPECTED_DATA, SCHEMA, getFormData } from './test-fixtures.js';

describe('utils', () => {
  test('formDataToObject', () => {
    const formData = getFormData();
    const object = formDataToObject(formData, SCHEMA);
    expect(object).toStrictEqual(EXPECTED_DATA);
  });

  test('objectToFormData', () => {
    const formData = getFormData();
    const object = formDataToObject(formData, SCHEMA);
    expect(formDataToObject(objectToFormData(object), SCHEMA)).toStrictEqual(object);

    const undefinedFormData = objectToFormData({
      unused: undefined
    });

    expect(undefinedFormData.get('unused')).toBe(null);
  });

  test('flattenObject', () => {
    const formData = getFormData();
    const object = formDataToObject(formData, SCHEMA);
    const flatObject = flattenObject(object);

    expect(Object.keys(flatObject).sort()).toStrictEqual(
      [
        'bigInt',
        'bigIntArray',
        'boolean',
        'defaultBoolean',
        'booleanArray',
        'number',
        'numberArray',
        'string',
        'stringArray',
        'enum',
        'object.string',
        'object.numberArray',
        'object.nested.string',
        'toc'
      ].sort()
    );
  });

  test('flattenSchema', () => {
    const flatSchema = flattenSchema(SCHEMA);
    expect(Object.keys(flatSchema).sort()).toStrictEqual(
      [
        'bigInt',
        'bigIntArray',
        'boolean',
        'defaultBoolean',
        'booleanArray',
        'number',
        'numberArray',
        'string',
        'stringArray',
        'enum',
        'object',
        'object.nested',
        'object.string',
        'object.numberArray',
        'object.nested.string',
        'toc'
      ].sort()
    );
  });

  test('parseFormData', () => {
    const result = parseFormData(getFormData(), SCHEMA);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toStrictEqual(EXPECTED_DATA);
    }
  });

  test('emptyArrayHandling', () => {
    const schema = z.object({
      array: z.array(z.string())
    });
    const formData = new FormData();
    formData.append('array', '');
    expect(parseFormData(formData, schema).success).toBe(true);
  });
});
