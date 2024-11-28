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

function parseWithZodTyp(type: z.ZodFirstPartyTypeKind, value: string) {
  if (value === '') {
    return undefined;
  }

  switch (type) {
    case z.ZodFirstPartyTypeKind.ZodBigInt:
      return BigInt(value);
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return value === 'true' || value === 'on';
    case z.ZodFirstPartyTypeKind.ZodDate:
      return new Date(value);
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return Number(value);
    case z.ZodFirstPartyTypeKind.ZodLiteral:
      return value === 'true' || value === 'on';
    default:
      return value;
  }
}

export function formDataToObject<TSchema extends z.ZodSchema>(formData: FormData, schema: TSchema) {
  const flatSchema = flattenSchema(schema);
  const flatObject: any = {};

  for (const [key, value] of formData.entries()) {
    if (flatSchema[key] === undefined) {
      continue;
    }

    const valueSchema = fullyUnwrap(flatSchema[key]);
    const zodType = zodTypeOf(valueSchema);

    if (value instanceof File) {
      throw new Error('File fields are not supported yet!');
    }

    if (flatObject[key]) {
      if (Array.isArray(flatObject[key])) {
        flatObject[key].push(value);
      } else {
        flatObject[key] = [flatObject[key], value];
      }
    } else {
      if (zodType === z.ZodFirstPartyTypeKind.ZodArray) {
        flatObject[key] = [value];
      } else {
        flatObject[key] = value;
      }
    }
  }

  for (const key of Object.keys(flatSchema)) {
    const valueSchema = fullyUnwrap(flatSchema[key]);
    const zodType = zodTypeOf(valueSchema);

    if (Array.isArray(flatObject[key])) {
      const arrayDef = valueSchema._def as z.ZodArrayDef;
      flatObject[key] = flatObject[key].map((value: string) => parseWithZodTyp(zodTypeOf(arrayDef.type), value));
    } else if (flatObject[key] !== undefined) {
      flatObject[key] = parseWithZodTyp(zodType, flatObject[key]);
    } else if (zodType === ZodFirstPartyTypeKind.ZodBoolean) {
      flatObject[key] = false;
    }
  }

  const object: any = {};

  for (const key in flatObject) {
    setNested(object, key.split('.'), flatObject[key]);
  }

  const result = clearUndefined(object) as z.infer<TSchema>;

  return result;
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

function _flattenSchema(shape: any, prefix = '') {
  return Object.keys(shape).reduce(
    (acc, key) => {
      const pre = prefix !== '' ? `${prefix}.` : '';
      const value = shape[key];
      const _shape = extractShape(value);

      if (_shape) {
        acc[pre + key] = value;
        Object.assign(acc, _flattenSchema(_shape, pre + key));
      } else {
        acc[pre + key] = value;
      }
      return acc;
    },
    {} as Record<string, z.Schema>
  );
}

export function flattenSchema<TSchema extends z.ZodSchema>(schema: TSchema, prefix = '') {
  const type = zodTypeOf(fullyUnwrap(schema));
  if (type !== ZodFirstPartyTypeKind.ZodObject) {
    throw new Error('Only a ZodObject can be flattened. ');
  }

  const shape = extractShape(schema);
  return _flattenSchema(shape, prefix);
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

function extractShape(schema: z.ZodSchema) {
  const shapeFn = (fullyUnwrap(schema)._def as Record<string, any>)['shape'];

  if (shapeFn) {
    return shapeFn() as Record<string, z.ZodSchema>;
  }

  return undefined;
}

export function parseFormData<TSchema extends z.ZodSchema>(
  formData: FormData,
  schema: TSchema
): z.SafeParseReturnType<any, z.infer<TSchema>> {
  return schema.safeParse(formDataToObject(formData, schema));
}

function clearUndefined(obj: any) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    // Recursively clear undefined values in array elements
    for (let i = 0; i < obj.length; i++) {
      if (obj[i] === undefined) {
        obj.splice(i, 1);
        i--; // Adjust index after removal
      } else {
        clearUndefined(obj[i]);
      }
    }
  } else {
    // Recursively clear undefined values in object properties
    for (const key in obj) {
      if (obj[key] === undefined) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        clearUndefined(obj[key]);
      }
    }
  }

  return obj;
}
