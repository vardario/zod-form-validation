import { ZodDefaultDef, ZodEffectsDef, ZodFirstPartyTypeKind, ZodOptionalDef, z } from 'zod';

import { DATA_VALIDATION_ERROR_MESSAGE_ATTRIBUTE_NAME } from './form-validation.js';

export function setNested(obj: Record<string, any>, [first, ...rest]: string[], val: any) {
  if (rest.length === 0) {
    obj[first] = val;
  } else {
    let nested = obj[first];
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
      nested = {};
      obj[first] = nested;
    }
    setNested(nested, rest, val);
  }
}

export function fullyUnwrap<TSchema extends z.ZodSchema>(schema: TSchema) {
  let result = schema as Record<string, any>;
  const type = zodTypeOf(schema);

  if (type === ZodFirstPartyTypeKind.ZodEffects) {
    return fullyUnwrap((schema._def as ZodEffectsDef).schema);
  }

  if (type === ZodFirstPartyTypeKind.ZodOptional) {
    result = fullyUnwrap((schema._def as ZodOptionalDef).innerType);
  }

  if (type === ZodFirstPartyTypeKind.ZodDefault) {
    result = fullyUnwrap((schema._def as ZodDefaultDef).innerType);
  }

  while (result['unwrap'] !== undefined && typeof result['unwrap'] === 'function') {
    result = result['unwrap']();
  }
  return result as TSchema;
}

export function zodTypeOf<TSchema extends z.ZodSchema>(schema: TSchema) {
  return (schema._def as Record<string, any>)['typeName'] as z.ZodFirstPartyTypeKind;
}

export function flattenObject(object: any, prefix = '') {
  return Object.keys(object).reduce((acc, key) => {
    const pre = prefix !== '' ? `${prefix}.` : '';
    const value = object[key];

    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, pre + key));
    } else {
      acc[pre + key] = value;
    }
    return acc;
  }, {} as any);
}

export type ObjectType = FormDataEntryValue[] | { [key: string]: ObjectType };

const preprocessValues = (schema: z.ZodTypeAny, data: any): any => {
  schema = fullyUnwrap(schema);
  const type = zodTypeOf(fullyUnwrap(schema));

  if (data === '') {
    return undefined;
  }

  if (type === z.ZodFirstPartyTypeKind.ZodNumber) {
    return typeof data === 'string' && !isNaN(Number(data)) ? Number(data) : data;
  }

  if (type === z.ZodFirstPartyTypeKind.ZodBoolean) {
    return data === 'true' || data === 'on';
  }

  if (type === z.ZodFirstPartyTypeKind.ZodBigInt) {
    return typeof data === 'string' && !isNaN(Number(data)) ? BigInt(data) : data;
  }

  if (type === z.ZodFirstPartyTypeKind.ZodEnum) {
    return data; // Enums are handled by Zod
  }

  if (type === z.ZodFirstPartyTypeKind.ZodDate) {
    return new Date(data);
  }

  if (type === z.ZodFirstPartyTypeKind.ZodString) {
    return data === '' ? undefined : data;
  }

  if (type === z.ZodFirstPartyTypeKind.ZodArray) {
    const arraySchema = schema as z.ZodArray<any>;
    if (Array.isArray(data)) {
      return data.map(item => preprocessValues(arraySchema.element, item));
    }

    const value = preprocessValues(arraySchema.element, data);
    return value === undefined ? [] : [value];
  }

  if (type === z.ZodFirstPartyTypeKind.ZodObject) {
    const zodObjectSchema = schema as z.ZodObject<any>;
    if (typeof data !== 'object' || data === null) return data;
    return Object.fromEntries(
      Object.entries(zodObjectSchema.shape).map(([key, valueSchema]) => [
        key,
        preprocessValues(valueSchema as any, data[key])
      ])
    );
  }

  if (type === z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion) {
    const zodDiscriminatedUnionSchema = schema as z.ZodDiscriminatedUnion<any, any>;
    if (typeof data !== 'object' || !data || !data[zodDiscriminatedUnionSchema.discriminator]) return data;

    // Determine correct schema branch
    const selectedSchema = zodDiscriminatedUnionSchema.optionsMap.get(data[zodDiscriminatedUnionSchema.discriminator]);
    if (!selectedSchema) return data;

    // Recursively process the selected branch
    return preprocessValues(selectedSchema, data);
  }

  return data;
};

export function formDataToObject<TSchema extends z.ZodSchema>(
  formData: FormData,
  schema: TSchema,
  removeEmptyObjects: boolean = false
) {
  const flatObject: any = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      throw new Error('File fields are not supported yet!');
    }

    if (!flatObject[key]) {
      flatObject[key] = value;
    } else {
      if (Array.isArray(flatObject[key])) {
        flatObject[key].push(value);
      } else {
        flatObject[key] = [flatObject[key], value];
      }
    }
  }

  const object: any = {};

  for (const key in flatObject) {
    setNested(object, key.split('.'), flatObject[key]);
  }

  return clearUndefined(preprocessValues(schema, object), removeEmptyObjects);
}

export function objectToFormData(obj: any) {
  const flatObject = flattenObject(obj) as Record<string, any>;

  const formData = new FormData();
  for (const key of Object.keys(flatObject)) {
    const value = flatObject[key];
    if (Array.isArray(value)) {
      value.forEach(v => formData.append(key, v.toString()));
    } else if (value !== undefined) {
      formData.append(key, value.toString());
    }
  }
  return formData;
}

export function groupIssuesByName(issues: z.ZodIssue[]) {
  return issues.reduce(
    (acc, issue) => {
      const name = issue.path.join('.');
      if (acc[name] === undefined) {
        acc[name] = [];
      }
      acc[name].push(issue);

      return acc;
    },
    {} as Record<string, z.ZodIssue[]>
  );
}

export function observerValidationErrors(input: HTMLElement, cb: (errors: string[]) => void) {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes') {
        if (mutation.attributeName === DATA_VALIDATION_ERROR_MESSAGE_ATTRIBUTE_NAME) {
          cb(input.dataset.validationErrorMessage?.split('\n') || []);
        }
      }
    });
  });

  observer.observe(input, { attributes: true });
}

export function parseFormData<TSchema extends z.ZodSchema>(
  formData: FormData,
  schema: TSchema
): z.SafeParseReturnType<any, z.infer<TSchema>> {
  return schema.safeParse(formDataToObject(formData, schema, true));
}

export function clearUndefined(obj: any, removeEmptyObjects: boolean = false): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    // Recursively clear undefined values in array elements
    for (let i = 0; i < obj.length; i++) {
      obj[i] = clearUndefined(obj[i], removeEmptyObjects);
      if (obj[i] === undefined || obj[i] === false) {
        obj.splice(i, 1);
        i--; // Adjust index after removal
      }
    }
    return obj; // Keep empty arrays
  } else {
    // Recursively clear undefined values in object properties
    for (const key in obj) {
      obj[key] = clearUndefined(obj[key], removeEmptyObjects);
      if (
        obj[key] === undefined ||
        (removeEmptyObjects &&
          typeof obj[key] === 'object' &&
          !Array.isArray(obj[key]) &&
          Object.keys(obj[key]).length === 0)
      ) {
        delete obj[key];
      }
    }
  }

  return removeEmptyObjects && Object.keys(obj).length === 0 ? undefined : obj;
}

export function unsetLeafNodes(obj: any, ignoreList: string[] = [], path = ''): any {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return [key, unsetLeafNodes(value, ignoreList, currentPath)];
      }

      // Keep value if the path is in the ignore list, otherwise set to undefined
      return [key, ignoreList.includes(currentPath) ? value : undefined];
    })
  );
}

export const findDiscriminatorPaths = (schema: z.ZodTypeAny, path: string = ''): string[] => {
  schema = fullyUnwrap(schema);
  const type = zodTypeOf(schema);

  const paths: string[] = [];

  if (type === z.ZodFirstPartyTypeKind.ZodObject) {
    const zodObjectSchema = schema as z.ZodObject<any>;
    for (const key in zodObjectSchema.shape) {
      const subPaths = findDiscriminatorPaths(zodObjectSchema.shape[key], path ? `${path}.${key}` : key);
      paths.push(...subPaths);
    }
  }

  if (type === z.ZodFirstPartyTypeKind.ZodArray) {
    const arraySchema = schema as z.ZodArray<any>;
    const subPaths = findDiscriminatorPaths(arraySchema.element, path ? `${path}[]` : '[]');
    paths.push(...subPaths);
  }

  if (type === z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion) {
    const zodDiscriminatedUnionSchema = schema as z.ZodDiscriminatedUnion<any, any>;
    paths.push(
      path ? `${path}.${zodDiscriminatedUnionSchema.discriminator}` : zodDiscriminatedUnionSchema.discriminator
    );
  }

  return paths;
};
