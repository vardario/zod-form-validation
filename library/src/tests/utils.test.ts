import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import {
  flattenObject,
  flattenSchema,
  formDataToObject,
  objectToFormData,
  parseFormData,
  preprocess,
} from '../utils.js';
import { EXPECTED_DATA, SCHEMA, getFormData } from './test-fixtures.js';

describe('utils', () => {
  test('formDataToObject', () => {
    const formData = getFormData();
    const object = formDataToObject(formData);
    expect(object).toStrictEqual({
      bigInt: ['1'],
      bigIntArray: ['0', '1', '2'],
      boolean: ['true'],
      defaultBoolean: ['true'],
      booleanArray: ['true', 'false'],
      number: ['1024'],
      numberArray: ['0'],
      string: ['string'],
      stringArray: ['0', '1', '2'],
      enum: ['ONE'],
      object: {
        string: ['string'],
        numberArray: ['0', '1', '2'],
        nested: { string: ['string'] },
      },
    });
  });

  test('objectToFormData', () => {
    const formData = getFormData();
    const object = formDataToObject(formData);
    expect(formDataToObject(objectToFormData(object))).toStrictEqual(object);
  });

  test('flattenObject', () => {
    const formData = getFormData();
    const object = formDataToObject(formData);
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
      ].sort(),
    );

    const allElementsAreArrays = Object.values(flatObject)
      .map((value) => Array.isArray(value))
      .reduce((acc, value) => acc && value, true);

    expect(allElementsAreArrays).toBe(true);
  });

  test('preprocess', () => {
    const formData = getFormData();
    const formDataObject = formDataToObject(formData);
    const object = preprocess(formDataObject, SCHEMA);
    expect(object).toStrictEqual(EXPECTED_DATA);
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
      ].sort(),
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
      array: z.array(z.string()),
    });
    const formData = new FormData();
    formData.append('array', '');
    expect(parseFormData(formData, schema).success).toBe(true);
  });
});
