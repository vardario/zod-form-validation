import { z } from 'zod';
import {
  findDiscriminatorPaths,
  formDataToObject,
  groupIssuesByName,
  objectToFormData,
  unsetLeafNodes
} from './utils.js';

export const DATA_VALIDATION_ERROR_ATTRIBUTE_NAME = 'data-validation-error';
export const DATA_VALIDATION_ERROR_MESSAGE_ATTRIBUTE_NAME = 'data-validation-error-message';
export const DATA_VALIDATION_REQUIRED_ATTRIBUTE_NAME = 'data-validation-required';

function setSelectElementValue(selectElement: HTMLSelectElement, values: string[]) {
  const options = [...selectElement.children].filter(item => item.nodeName === 'OPTION') as HTMLOptionElement[];
  options.forEach(option => option.removeAttribute('selected'));

  const selectedOptions = options.filter(option => values.includes(option.value));
  selectedOptions.forEach(option => option.setAttribute('selected', ''));

  const valueDiff = values.filter(value => options.find(option => option.value === value) === undefined);
  valueDiff.forEach(value => {
    const option = document.createElement('option');
    option.setAttribute('value', value);
    option.setAttribute('selected', '');
    selectElement.add(option);
  });
}

function setInputElementValue(inputElement: HTMLInputElement, value: string) {
  if (inputElement.type === 'checkbox' || inputElement.type === 'radio') {
    if (value === 'true') {
      inputElement.setAttribute('checked', '');
      inputElement.setAttribute('value', value);
      inputElement.value = value;
      inputElement.checked = true;
    } else {
      inputElement.removeAttribute('checked');
      inputElement.checked = false;
    }
  } else {
    inputElement.value = value;
  }
}

export function setFormDataToForm(form: HTMLFormElement, formData: FormData) {
  for (const key of formData.keys()) {
    const safeKey = key.replace(/([#.;,[\]'"=<>~:+*()$^|{}])/g, '\\$1');

    const formInputs = [
      ...form.querySelectorAll(`input[name="${safeKey}"], select[name="${safeKey}"], textarea[name="${safeKey}"]`)
    ];
    const values = formData.getAll(key).filter(v => !(v instanceof File)) as string[];

    formInputs.forEach(formInput => {
      if (formInput.nodeName === 'SELECT') {
        const selectElement = formInput as HTMLSelectElement;
        setSelectElementValue(selectElement, values);
      }

      if (formInput.nodeName === 'INPUT') {
        const inputElement = formInput as HTMLInputElement;
        values.forEach(value => setInputElementValue(inputElement, value));
      }

      if (formInput.nodeName === 'TEXTAREA') {
        const textareaElement = formInput as HTMLTextAreaElement;
        textareaElement.value = values[0];
        textareaElement.setAttribute('value', values[0]);
      }
    });
  }
}

export function setDataToForm(form: HTMLFormElement, data: any) {
  const formData = objectToFormData(data);
  setFormDataToForm(form, formData);
}

export function validateFormData<TSchema extends z.Schema>(formData: FormData, schema: TSchema) {
  return schema.safeParse(formDataToObject(formData, schema));
}

export function clearFormValidationErrors(form: HTMLFormElement) {
  const controls = [...form.elements].filter(control =>
    ['INPUT', 'SELECT', 'TEXTAREA', 'FIELDSET'].includes(control.nodeName)
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
      const errorMessage = issues.map(issue => issue.message).join('\n');
      inputElement.setCustomValidity(errorMessage);
      inputElement.setAttribute(DATA_VALIDATION_ERROR_ATTRIBUTE_NAME, 'true');
      inputElement.setAttribute(DATA_VALIDATION_ERROR_MESSAGE_ATTRIBUTE_NAME, errorMessage);
    }
  }
}

export function setRequiresToForm<TSchema extends z.Schema>(form: HTMLFormElement, schema: TSchema) {
  const ignoreList = findDiscriminatorPaths(schema);
  const result = schema.safeParse(unsetLeafNodes(formDataToObject(new FormData(form), schema), ignoreList));

  if (!result.success) {
    result.error.issues.forEach(issue => {
      if (issue.code === 'invalid_type' && issue.received === 'undefined') {
        const inputElement = form.querySelector(`[name="${issue.path.join('.')}"]`);
        if (inputElement && inputElement.getAttribute('type') !== 'radio') {
          inputElement.setAttribute(DATA_VALIDATION_REQUIRED_ATTRIBUTE_NAME, 'true');
        }
      }
    });
  }
}
