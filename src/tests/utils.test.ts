import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import {
  clearUndefined,
  findDiscriminatorPaths,
  flattenObject,
  formDataToObject,
  objectToFormData,
  parseFormData,
  unsetLeafNodes
} from '../utils.js';
import { EXPECTED_DATA, SCHEMA, getFormData } from './test-fixtures.js';

describe('utils', () => {
  test('formDataToObject', () => {
    const formData = getFormData();
    expect(formDataToObject(formData, SCHEMA)).toStrictEqual(EXPECTED_DATA);

    const omittedData = { ...EXPECTED_DATA, number: undefined };
    delete omittedData.number;

    expect(
      formDataToObject(
        formData,
        SCHEMA.omit({
          number: true
        })
      )
    ).toStrictEqual(omittedData);
  });

  test('discriminatedUnionSchema', () => {
    const schemaA = z.object({
      type: z.literal('A'),
      a: z.number()
    });

    const schemaB = z.object({
      type: z.literal('B'),
      a: z.string(),
      b: z.number()
    });

    const discriminatedUnionSchema = z.discriminatedUnion('type', [schemaA, schemaB]);

    const formDataTypeA = new FormData();
    formDataTypeA.append('type', 'A');
    formDataTypeA.append('a', '10');

    const formDataTypeB = new FormData();
    formDataTypeB.append('type', 'B');
    formDataTypeB.append('a', '10');
    formDataTypeB.append('b', '10');

    const resultA = parseFormData(formDataTypeA, discriminatedUnionSchema);

    if (!resultA.success) {
      throw new Error('Failed to parse form data');
    }

    expect(resultA.data).toStrictEqual({
      type: 'A',
      a: 10
    });

    const resultB = parseFormData(formDataTypeB, discriminatedUnionSchema);

    if (!resultB.success) {
      throw new Error('Failed to parse form data');
    }

    expect(resultB.data).toStrictEqual({
      type: 'B',
      a: '10',
      b: 10
    });
  });

  test('findDiscriminatorPaths', () => {
    const schemaA = z.object({
      type: z.literal('A'),
      a: z.number()
    });

    const schemaB = z.object({
      type: z.literal('B'),
      a: z.string(),
      b: z.number()
    });

    const discriminatedUnionSchema = z.discriminatedUnion('type', [schemaA, schemaB]);

    const nestedObject = z.object({
      object: discriminatedUnionSchema
    });

    expect(findDiscriminatorPaths(discriminatedUnionSchema)).toStrictEqual(['type']);
    expect(findDiscriminatorPaths(nestedObject)).toStrictEqual(['object.type']);
  });

  test('unsetLeafNodes', () => {
    const object = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
          f: {
            g: 4
          }
        }
      }
    };

    expect(unsetLeafNodes(object)).toStrictEqual({
      a: undefined,
      b: {
        c: undefined,
        d: {
          e: undefined,
          f: {
            g: undefined
          }
        }
      }
    });

    expect(unsetLeafNodes(object, ['a', 'b.d.e'])).toStrictEqual({
      a: 1,
      b: {
        c: undefined,
        d: {
          e: 3,
          f: {
            g: undefined
          }
        }
      }
    });
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

  test('parseFormData', () => {
    const result = parseFormData(getFormData(), SCHEMA);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toStrictEqual(EXPECTED_DATA);
    }
  });

  test('clearUndefined', () => {
    expect(
      clearUndefined({
        a: undefined
      })
    ).toStrictEqual({});

    expect(
      clearUndefined(
        {
          a: undefined
        },
        true
      )
    ).toStrictEqual(undefined);

    expect(
      clearUndefined({
        a: {
          b: undefined
        }
      })
    ).toStrictEqual({ a: {} });

    expect(
      clearUndefined(
        {
          a: {
            b: undefined
          }
        },
        true
      )
    ).toStrictEqual(undefined);

    expect(
      clearUndefined({
        a: {
          b: []
        }
      })
    ).toStrictEqual({
      a: {
        b: []
      }
    });

    expect(
      clearUndefined(
        {
          a: {
            b: []
          }
        },
        true
      )
    ).toStrictEqual({
      a: {
        b: []
      }
    });
  });
});
