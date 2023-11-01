import { z } from 'zod';
import { flattenSchema, formDataToObject, groupIssuesByName, objectToFormData, preprocess } from './utils.js';

export const DATA_VALIDATION_ERROR_ATTRIBUTE_NAME = 'data-validation-error';
export const DATA_VALIDATION_ERROR_MESSAGE_ATTRIBUTE_NAME = 'data-validation-error-message';
export const DATA_VALIDATION_REQUIRED_ATTRIBUTE_NAME = 'data-validation-required';

function setSelectElementValue(selectElement: HTMLSelectElement, values: string[]) {
  for (const child of selectElement.children) {
    if (child.nodeName === 'OPTION') {
      const optionElement = child as HTMLOptionElement;
      optionElement.removeAttribute('selected');

      if (values.includes(optionElement.value)) {
        optionElement.setAttribute('selected', '');
      }
    }
  }
}

function setInputElementValue(inputElement: HTMLInputElement, value: string) {
  if (inputElement.type === 'checkbox' || inputElement.type === 'radio') {
    inputElement.checked = inputElement.value === value.replace('true', 'on');
  } else {
    inputElement.value = value;
  }
}

export function setFormDataToForm(form: HTMLFormElement, formData: FormData) {
  for (const key of formData.keys()) {
    const formInputs = [...form.querySelectorAll(`[name="${key}"]`)];
    const values = formData.getAll(key).filter((v) => !(v instanceof File)) as string[];

    formInputs.forEach((formInput) => {
      if (formInput.nodeName === 'SELECT') {
        const selectElement = formInput as HTMLSelectElement;
        setSelectElementValue(selectElement, values);
      }

      if (formInput.nodeName === 'INPUT') {
        const inputElement = formInput as HTMLInputElement;
        values.forEach((value) => setInputElementValue(inputElement, value));
      }

      if (formInput.nodeName === 'TEXTAREA') {
        const textareaElement = formInput as HTMLTextAreaElement;
        textareaElement.value = values[0];
      }
    });
  }
}

export function setDataToForm(form: HTMLFormElement, data: any) {
  const formData = objectToFormData(data);
  setFormDataToForm(form, formData);
}

export function validateFormData<TSchema extends z.Schema>(formData: FormData, schema: TSchema) {
  const object = preprocess(formDataToObject(formData), schema);
  return schema.safeParse(object);
}

export function clearFormValidationErrors(form: HTMLFormElement) {
  const controls = [...form.elements].filter((control) =>
    ['INPUT', 'SELECT', 'TEXTAREA', 'FIELDSET'].includes(control.nodeName),
  ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];
  for (const control of controls) {
    const inputElement = control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    inputElement.setAttribute(DATA_VALIDATION_ERROR_ATTRIBUTE_NAME, 'false');
    inputElement.removeAttribute(DATA_VALIDATION_ERROR_MESSAGE_ATTRIBUTE_NAME);
    inputElement.setCustomValidity('');
  }
}

export function setValidationErrorsToForm(form: HTMLFormElement, error: z.ZodError) {
  clearFormValidationErrors(form);
  const issuesByName = groupIssuesByName(error.issues);

  for (const name of Object.keys(issuesByName)) {
    const inputElement = form.querySelector(`[name="${name}"]`) as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    const issues = issuesByName[name];
    if (inputElement) {
      const errorMessage = issues.map((issue) => issue.message).join('\n');
      inputElement.setCustomValidity(errorMessage);
      inputElement.setAttribute(DATA_VALIDATION_ERROR_ATTRIBUTE_NAME, 'true');
      inputElement.setAttribute(DATA_VALIDATION_ERROR_MESSAGE_ATTRIBUTE_NAME, errorMessage);
    }
  }
}

export function setRequiresToForm<TSchema extends z.Schema>(form: HTMLFormElement, schema: TSchema) {
  const flatSchema = flattenSchema(schema);

  for (const key of Object.keys(flatSchema)) {
    if (!flatSchema[key].isOptional()) {
      const inputElement = form.querySelector(`[name="${key}"]`);

      inputElement &&
        inputElement.getAttribute('type') !== 'radio' &&
        inputElement.setAttribute(DATA_VALIDATION_REQUIRED_ATTRIBUTE_NAME, 'true');
    }
  }
}
