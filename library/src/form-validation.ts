import set from "lodash/set.js";
import isArray from "lodash/isArray.js";
import isObject from "lodash/isObject.js";
import reduce from "lodash/reduce.js";
import difference from "lodash/difference.js";

import { ZodFirstPartyTypeKind, ZodSchema, z } from "zod";

export const DATA_VALIDATION_ERROR_ATTRIBUTE_NAME = "data-validation-error";
export const DATA_VALIDATION_REQUIRED_ATTRIBUTE_NAME =
  "data-validation-required";

export type FormInputElement =
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLInputElement;

export type ValidationErrors = Record<string, string[]>;

function unwrapSchema<TSchema extends z.ZodSchema>(schema: TSchema) {
  const type = extractTypeName(schema);

  if (type === ZodFirstPartyTypeKind.ZodEffects) {
    return unwrapSchema((schema._def as any).schema);
  }

  if (type === ZodFirstPartyTypeKind.ZodOptional) {
    return unwrapSchema((schema._def as any).innerType);
  }

  return schema;
}

function extractShape(schema: ZodSchema) {
  const shapeFn = (unwrapSchema(schema)._def as Record<string, any>)["shape"];

  if (shapeFn) {
    return shapeFn() as Record<string, ZodSchema>;
  }

  return undefined;
}

export function formDataToObject<TSchema extends z.ZodSchema>(
  formData: FormData,
  schema: TSchema
) {
  const data = {} as any;
  const mapping = flattenSchema(schema);

  const coerceValue = (values: FormDataEntryValue[], schema: TSchema): any => {
    const type = extractTypeName(schema);

    if (values.length === 0) {
      return undefined;
    }

    const convertValue = (_type: ZodFirstPartyTypeKind, value: any) => {
      if (value instanceof File) {
        console.error("File is not support as an form field element");
        return undefined;
      }

      if (_type === ZodFirstPartyTypeKind.ZodNumber) {
        return value === "" ? undefined : Number(value);
      }

      if (_type === ZodFirstPartyTypeKind.ZodBoolean) {
        const mapping: Record<string, boolean> = {
          true: true,
          on: true,
          false: false,
          "": false,
        };

        return mapping[value] || false;
      }

      if (
        _type === ZodFirstPartyTypeKind.ZodBigInt &&
        typeof values[0] !== "object"
      ) {
        return BigInt(value);
      }

      return value === '' ? undefined : value;
    };

    if (type === ZodFirstPartyTypeKind.ZodArray) {
      return values.map((value) =>
        convertValue(extractTypeName((schema._def as any).type), value)
      );
    }

    return convertValue(type, values[0]);
  };

  for (const key of formData.keys()) {
    const values = formData.getAll(key);
    const value = coerceValue(values, unwrapSchema(mapping[key]));

    set(data, key, value);
  }

  return data;
}

function extractTypeName<TSchema extends z.ZodSchema>(s: TSchema) {
  return (s._def as Record<string, any>)["typeName"] as ZodFirstPartyTypeKind;
}

export function flattenObject(object: any, prefix = "") {
  return Object.keys(object).reduce((acc, key) => {
    const pre = prefix !== "" ? `${prefix}.` : "";
    const value = object[key];

    if (isObject(value) && !isArray(value)) {
      Object.assign(acc, flattenObject(value, pre + key));
    } else {
      acc[pre + key] = value;
    }
    return acc;
  }, {} as any);
}

export function flattenSchema<TSchema extends z.ZodSchema>(
  schema: TSchema,
  prefix = ""
) {
  const _flattenShape = (shape: any, prefix = "") => {
    return Object.keys(shape).reduce((acc, key) => {
      const pre = prefix !== "" ? `${prefix}.` : "";
      const value = shape[key];
      const _shape = extractShape(value);

      if (_shape) {
        Object.assign(acc, _flattenShape(_shape, pre + key));
      } else {
        acc[pre + key] = value;
      }
      return acc;
    }, {} as Record<string, TSchema>);
  };

  return _flattenShape(extractShape(schema), prefix);
}

export function validateFormData<TSchema extends z.ZodSchema>(
  formData: FormData,
  schema: TSchema
) {
  const object = formDataToObject(formData, schema);
  const result = schema.safeParse(object);

  if (result.success) {
    return {
      success: true,
    };
  }

  const errors = reduce(
    flattenObject(result.error.format()),
    (acc, value, key) => {
      acc[key.replace("._errors", "")] = value;
      return acc;
    },
    {} as ValidationErrors
  );

  delete errors._errors;

  return {
    success: false,
    errors,
  };
}

export function collectFormInputs(form: HTMLFormElement) {
  return [...form.elements].filter((element) =>
    ["INPUT", "SELECT", "TEXTAREA"].includes(element.nodeName)
  ) as FormInputElement[];
}

export function getInputsByNameMapping(inputs: FormInputElement[]) {
  return inputs.reduce((acc, input) => {
    acc[input.name] = input;
    return acc;
  }, {} as Record<string, FormInputElement>);
}

export function setFormData(form: HTMLFormElement, data: any) {
  const formInputs = collectFormInputs(form);
  const flattenData = flattenObject(data);
  const inputsByName = getInputsByNameMapping(formInputs);

  for (const key of Object.keys(flattenData)) {
    if (flattenData[key]) {
      const input = inputsByName[key];
      const value = flattenData[key];

      if (input.nodeName === "INPUT") {
        const inputElement = input as HTMLInputElement;
        if (inputElement.type === "checkbox") {
          inputElement.checked = value;
        } else {
          inputElement.value = value;
        }
      } else if (input.nodeName === "TEXTAREA") {
        const textAreaElement = input as HTMLTextAreaElement;
        textAreaElement.value = value;
      } else if (input.nodeName === "SELECT") {
        const select = input as HTMLSelectElement;
        for (const child of select.children) {
          if (child.nodeName === "OPTION") {
            const option = child as HTMLOptionElement;
            option.removeAttribute("selected");

            if (isArray(value)) {
              if (value.map((v) => v.toString()).includes(option.value)) {
                option.setAttribute("selected", "");
              }
            } else {
              if (option.value == value) {
                option.setAttribute("selected", "");
              }
            }
          }
        }
      }
    }
  }
}

export function isInputCovering(inputs: FormInputElement[], schema: ZodSchema) {
  const schemaFields = Object.keys(flattenSchema(schema));
  const inputFields = inputs.map((input) => input.name);
  const diff = difference(schemaFields, inputFields);

  return {
    success: diff.length === 0,
    diff,
  };
}

export function validateForm(form: HTMLFormElement, schema: z.Schema) {
  form.noValidate = true;

  const allInputs = collectFormInputs(form);
  const schemaMapping = flattenSchema(schema);
  let doValidate = false;

  const validateForm = () => {
    const coveringResult = isInputCovering(allInputs, schema);

    if (!coveringResult.success) {
      console.error(
        "Inputs are not covering the whole object, missing keys are ",
        coveringResult.diff
      );

      return false;
    }

    allInputs.forEach((input) => {
      input.setCustomValidity("");
      input.removeAttribute(DATA_VALIDATION_ERROR_ATTRIBUTE_NAME);
    });

    const result = validateFormData(new FormData(form), schema);

    if (result.success) {
      return true;
    }

    allInputs.forEach((input) => {
      const errors = result.errors?.[input.name];
      if (errors) {
        input.setCustomValidity(errors.join("\n"));
        input.setAttribute(
          DATA_VALIDATION_ERROR_ATTRIBUTE_NAME,
          errors.join("\n")
        );
      }
    });

    return false;
  };

  allInputs.forEach((input) => {
    input.addEventListener("input", () => doValidate && validateForm());

    if (
      schemaMapping[input.name] &&
      schemaMapping[input.name].isOptional() === false
    ) {
      input.setAttribute(DATA_VALIDATION_REQUIRED_ATTRIBUTE_NAME, "true");
    }
  });

  form.addEventListener("submit", (event) => {
    doValidate = true;
    if (!validateForm()) {
      event.preventDefault();
    }
  });
}

export function observerValidationErrors(
  input: FormInputElement,
  cb: (errors: string[]) => void
) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes") {
        if (mutation.attributeName === DATA_VALIDATION_ERROR_ATTRIBUTE_NAME) {
          cb(input.dataset.validationError?.split("\n") || []);
        }
      }
    });
  });

  observer.observe(input, { attributes: true });
}
