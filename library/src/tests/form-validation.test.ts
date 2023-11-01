import { describe, expect, test } from 'vitest';
import {
  setDataToForm,
  setFormDataToForm,
  setRequiresToForm,
  setValidationErrorsToForm,
  validateFormData,
} from '../form-validation.js';
import { formDataToData } from '../utils.js';
import { EXPECTED_DATA, SCHEMA, getDom, getFormData } from './test-fixtures.js';

describe('Form Validation', () => {
  test('setFormDataToForm', () => {
    const dom = getDom();
    const form = dom.window.document.querySelector('form');
    expect(form).not.toBeNull();
    setFormDataToForm(form!, getFormData());
    const formData = new FormData(form!);

    expect(formDataToData(formData, SCHEMA)).toStrictEqual(EXPECTED_DATA);
  });

  test('setDataToForm', () => {
    const dom = getDom();
    const form = dom.window.document.querySelector('form');
    expect(form).not.toBeNull();

    setDataToForm(form!, EXPECTED_DATA);
    const formData = new FormData(form!);
    expect(formDataToData(formData, SCHEMA)).toStrictEqual(EXPECTED_DATA);
  });

  test('validateFormData', () => {
    const dom = getDom();
    const form = dom.window.document.querySelector('form');
    expect(form).not.toBeNull();
    const validationFailedResult = validateFormData(new FormData(form!), SCHEMA);
    expect(validationFailedResult.success).toBe(false);
    if (validationFailedResult.success === false) {
      expect(validationFailedResult.error).toBeDefined();
    }

    setFormDataToForm(form!, getFormData());
    const validationSuccessResult = validateFormData(new FormData(form!), SCHEMA);
    expect(validationSuccessResult.success).toBe(true);
  });

  test('setFormValidationErrors', () => {
    const dom = getDom();
    const form = dom.window.document.querySelector('form');
    expect(form).not.toBeNull();

    const validationFailedResult = validateFormData(new FormData(form!), SCHEMA);
    expect(validationFailedResult.success).toBe(false);
    if (validationFailedResult.success === false) {
      setValidationErrorsToForm(form!, validationFailedResult.error);
      const inputs = form?.querySelectorAll('[data-validation-error=true]');
      expect([...inputs!].length).toBe(11);
    }
  });

  test('setRequiresToForm', () => {
    const dom = getDom();
    const form = dom.window.document.querySelector('form');
    setRequiresToForm(form!, SCHEMA);
    const inputs = form?.querySelectorAll('[data-validation-required]');
    expect(inputs).not.toBe(null);
    expect([...inputs!].length).toBe(11);
  });
});
