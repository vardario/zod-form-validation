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

export function preprocess<TSchema extends z.ZodSchema>(values: ObjectType, schema: TSchema): z.infer<TSchema> {
  const unboxedSchema = fullyUnwrap(schema);
  const zodType = zodTypeOf(unboxedSchema);

  if (typeof values === 'object' && !Array.isArray(values)) {
    if (zodType === z.ZodFirstPartyTypeKind.ZodObject) {
      const result: Record<string, any> = {};
      for (const key in values) {
        const propSchema = (unboxedSchema as unknown as z.SomeZodObject).shape[key];
        if (!propSchema) {
          continue;
        }
        result[key] = preprocess(values[key], propSchema);
      }
      return result;
    }
    return values;
  }

  const [value] = values;

  if (value instanceof File) {
    console.error('File fields are not supported yet!');
    return undefined;
  }

  switch (zodType) {
    case z.ZodFirstPartyTypeKind.ZodArray: {
      const arraySchema = unboxedSchema._def as z.ZodArrayDef;
      return values.length ? values.map((item) => preprocess([item], arraySchema.type)) : undefined;
    }

    case z.ZodFirstPartyTypeKind.ZodBigInt: {
      return value !== '' ? BigInt(value) : undefined;
    }
    case z.ZodFirstPartyTypeKind.ZodBoolean: {
      return value === 'true' || value === 'on' || false;
    }
    case z.ZodFirstPartyTypeKind.ZodDate: {
      return value !== '' ? new Date(value) : undefined;
    }
    case z.ZodFirstPartyTypeKind.ZodNumber: {
      return value !== '' ? Number(value) : undefined;
    }
    default: {
      return value === '' ? undefined : value;
    }
  }
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

export function formDataToObject(formData: FormData) {
  const result: ObjectType = {};
  for (const key of formData.keys()) {
    setNested(result, key.split('.'), formData.getAll(key));
  }
  return result;
}

export function formDataToData<TSchema extends z.ZodSchema>(formData: FormData, schema: TSchema){
  return preprocess(formDataToObject(formData), schema);

}

export function objectToFormData(obj: any) {
  const flatObject = flattenObject(obj) as Record<string, any>;

  const formData = new FormData();
  for (const key of Object.keys(flatObject)) {
    const value = flatObject[key];
    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(key, v.toString()));
    } else {
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
    {} as Record<string, z.ZodIssue[]>,
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
    {} as Record<string, z.Schema>,
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
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
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
  schema: TSchema,
): z.SafeParseReturnType<any, z.infer<TSchema>> {
  return schema.safeParse(preprocess(formDataToObject(formData), schema));
}
