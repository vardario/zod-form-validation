import { JSDOM } from 'jsdom';
import { z } from 'zod';

export const SCHEMA = z.object({
  string: z.string().optional(),
  toc: z.boolean().refine(val => val === true, {
    message: 'Please read and accept the terms and conditions'
  }),
  bigInt: z.bigint(),
  number: z.number(),
  stringArray: z.array(z.string()).min(1),
  numberArray: z.array(z.number()).min(1),
  bigIntArray: z.array(z.bigint()).min(1),
  enum: z.enum(['ONE', 'TWO']),
  object: z.object({
    string: z.string(),
    numberArray: z.array(z.number()).min(1),
    nested: z.object({
      string: z.string()
    })
  })
});

export type DataType = z.infer<typeof SCHEMA>;

export const EXPECTED_DATA: DataType = {
  toc: true,
  bigInt: 1n,
  bigIntArray: [0n, 1n, 2n],
  number: 1024,
  numberArray: [0],
  string: 'string',
  stringArray: ['0', '1', '2'],
  enum: 'ONE',
  object: {
    string: 'string',
    numberArray: [0, 1, 2],
    nested: {
      string: 'string'
    }
  }
};

export function getDom() {
  return new JSDOM(`
  <form>
  <input name="bigInt" />
  <select multiple name="bigIntArray">
      <option value="0">0</option>
      <option value="1">1</option>
      <option value="2">2</option>
  </select>
  <input name="toc" type="checkbox" />  
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
      <option value="">Select an option</option>
      <option value="ONE">One</option>
      <option value="TWO">Two</option>
  </select>
  <input name="object.string" />
  <select multiple name="object.numberArray">
      <option value="0">0</option>
      <option value="1">1</option>
      <option value="2">2</option>
  </select>
  <textarea name="object.nested.string"></textarea>
  <button>submit</button>
</form>
  `);
}

export function getFormData() {
  const formData = new FormData();

  formData.append('toc', 'true');
  formData.append('bigInt', '1');
  formData.append('bigIntArray', '0');
  formData.append('bigIntArray', '1');
  formData.append('bigIntArray', '2');
  formData.append('number', '1024');
  formData.append('numberArray', '0');
  formData.append('string', 'string');
  formData.append('stringArray', '0');
  formData.append('stringArray', '1');
  formData.append('stringArray', '2');
  formData.append('enum', 'ONE');

  formData.append('object.string', 'string');
  formData.append('object.numberArray', '0');
  formData.append('object.numberArray', '1');
  formData.append('object.numberArray', '2');
  formData.append('object.nested.string', 'string');

  return formData;
}
