import { describe, expect, test } from "vitest";
import { JSDOM } from "jsdom";
import { z } from "zod";
import {
  formDataToObject,
  flattenObject,
  validateFormData,
  isInputCovering,
  collectFormInputs,
  setFormData,
  validateForm,
} from "./form-validation.js";
import { getByTestId } from "@testing-library/dom";

const schema = z.object({
  string: z.string(),
  boolean: z.boolean(),
  bigInt: z.bigint(),
  number: z.number(),
  stringArray: z.array(z.string()),
  booleanArray: z.array(z.boolean()),
  numberArray: z.array(z.number()),
  bigIntArray: z.array(z.bigint()),
  enum: z.enum(["ONE", "TWO"]),
  object: z.object({
    string: z.string(),
    numberArray: z.array(z.number()),
    nested: z.object({
      string: z.string(),
    }),
  }),
});

type DataType = z.infer<typeof schema>;

const expectedData: DataType = {
  bigInt: 1n,
  bigIntArray: [0n, 1n, 2n],
  boolean: true,
  booleanArray: [true, false],
  number: 1024,
  numberArray: [0, 1, 2],
  string: "string",
  stringArray: ["0", "1", "2"],
  enum: "ONE",
  object: {
    string: "string",
    numberArray: [0, 1, 2],
    nested: {
      string: "string",
    },
  },
};

function getFormData() {
  const formData = new FormData();

  formData.append("bigInt", "1");
  formData.append("bigIntArray", "0");
  formData.append("bigIntArray", "1");
  formData.append("bigIntArray", "2");
  formData.append("boolean", "true");
  formData.append("booleanArray", "true");
  formData.append("booleanArray", "false");
  formData.append("number", "1024");
  formData.append("numberArray", "0");
  formData.append("numberArray", "1");
  formData.append("numberArray", "2");
  formData.append("string", "string");
  formData.append("stringArray", "0");
  formData.append("stringArray", "1");
  formData.append("stringArray", "2");
  formData.append("enum", "ONE");

  formData.append("object.string", "string");
  formData.append("object.numberArray", "0");
  formData.append("object.numberArray", "1");
  formData.append("object.numberArray", "2");
  formData.append("object.nested.string", "string");

  return formData;
}

describe("utils", () => {
  test("formDataToObject", () => {
    expect(formDataToObject(getFormData(), schema)).toStrictEqual(expectedData);
  });

  test("flattenObject", () => {
    const flatObject = flattenObject(expectedData);
    const keys = Object.keys(flatObject);

    expect(keys.length).toBe(12);
    expect(keys.sort()).toStrictEqual(
      [
        "bigInt",
        "bigIntArray",
        "boolean",
        "booleanArray",
        "number",
        "numberArray",
        "string",
        "stringArray",
        "object.string",
        "object.numberArray",
        "object.nested.string",
        "enum",
      ].sort()
    );
  });

  test("validateFormData", () => {
    const formData = getFormData();
    const successResult = validateFormData(formData, schema);
    expect(successResult.success).toBe(true);
    expect(successResult.errors).toBeUndefined();

    formData.delete("string");

    const failedResult = validateFormData(formData, schema);
    expect(failedResult.success).toBe(false);
    expect(failedResult.errors).toStrictEqual({ string: ["Required"] });
  });
});

describe("dom utils", () => {
  const getDom = () => {
    return new JSDOM(`
    <form>
    <input name="bigInt" />
    <select multiple name="bigIntArray">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
    </select>
    <input name="boolean" type="checkbox" />
    <select multiple name="booleanArray">
        <option value="true">true</option>
        <option value="false">false</option>

    </select>
    <input name="number" type="number" />
    <select multiple name="numberArray">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
    </select>
    <input name="string" />
    <select multiple name="stringArray">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
    </select>
    <select name="enum">
        <option value="ONE">One</option>
        <option value="TWO">Two</option>
    </select>
    <input name="object.string" />
    <select multiple name="object.numberArray">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
    </select>
    <textarea name="object.nested.string">
    </textarea>
    <button data-testid="button">submit</button>
</form>
    `);
  };

  test("collectFormInputs", () => {
    const dom = getDom();
    const form = dom.window.document.querySelector("form")!;
    const inputs = collectFormInputs(form);

    expect(inputs.map((input) => input.nodeName).sort()).toStrictEqual(
      [
        "INPUT",
        "INPUT",
        "INPUT",
        "INPUT",
        "INPUT",
        "SELECT",
        "SELECT",
        "SELECT",
        "SELECT",
        "SELECT",
        "SELECT",
        "TEXTAREA",
      ].sort()
    );
  });

  test("isInputCovering", () => {
    const dom = getDom();
    const form = dom.window.document.querySelector("form")!;

    const successResult = isInputCovering(collectFormInputs(form), schema);
    expect(successResult.success).toBe(true);

    const bigIntInput = form.querySelector('input[name="bigInt"]')!;
    bigIntInput.remove();

    const failedResult = isInputCovering(collectFormInputs(form), schema);
    expect(failedResult.success).toBe(false);
    expect(failedResult.diff).toStrictEqual(["bigInt"]);
  });

  test("setFormData", () => {
    const dom = getDom();
    const form = dom.window.document.querySelector("form")!;
    setFormData(form, expectedData);

    const object = formDataToObject(new FormData(form), schema);
    expect(object).toStrictEqual(expectedData);
  });

  test("validateForm", () => {
    const dom = getDom();
    const form = dom.window.document.querySelector("form")!;
    validateForm(form, schema);

    const button = getByTestId(form, "button");
    button.click();
  });
});
