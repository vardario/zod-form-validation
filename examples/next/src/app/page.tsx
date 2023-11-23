'use client';

import Input from '@/components/input';
import Form from '../components/form';
import { z } from 'zod';
import Select from '@/components/select';
import Textarea from '@/components/textarea';
import { formDataToObject } from '@vardario/zod-form-validation';

const petsSchema = z.enum(['dog', 'cat', 'hamster', 'parrot', 'spider', 'goldfish']);

const monsterSchema = z.enum(['kraken', 'sasquatch', 'mothman']);
const fruits = z.enum(['apple', 'banana', 'kiwi']);

const schema = z.object({
  admin: z.boolean().optional(),
  birthday: z.string().optional(),
  givenName: z.string().min(1),
  surname: z.string().min(1),
  contact: z.object({
    tel: z.string(),
    email: z
      .object({
        email: z.string().email(),
        confirmEmail: z.string().email()
      })
      .superRefine(({ email, confirmEmail }, context) => {
        if (email !== confirmEmail) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'E-Mail does not match',
            path: ['confirmEmail']
          });
        }
      })
  }),
  amount: z.number(),
  range: z.number(),
  pet: petsSchema,
  fruits: z.array(fruits),
  description: z.string(),
  monster: monsterSchema
});

export default function Home() {
  return (
    <main>
      <section className="flex min-h-screen">
        <Form
          data={{}}
          schema={schema}
          className="m-auto flex w-1/3 flex-col gap-2 rounded border p-4"
          onSubmit={event => {
            alert(JSON.stringify(formDataToObject(new FormData(event.target as HTMLFormElement), schema), null, 2));
            event.preventDefault();
          }}
        >
          <Input label="Admin" name="admin" type="checkbox" />
          <Input label="Given Name" name="givenName" />
          <Input label="Surname" name="surname" />
          <Input label="Birthday" name="birthday" type="date" />
          <Input label="Amount" name="amount" type="number" />
          <Input label="Range" name="range" type="range" min="0" max="100" step="1" />
          <div className="flex flex-col rounded border p-2">
            <Input label="Telephone" name="contact.tel" />
            <Input label="E-Mail" name="contact.email.email" />
            <Input label="Confirm E-Mail" name="contact.email.confirmEmail" />
          </div>

          <Select name="pet" label="Pet">
            <option value="">--Please choose an option--</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="hamster">Hamster</option>
            <option value="parrot">Parrot</option>
            <option value="spider">Spider</option>
            <option value="goldfish">Goldfish</option>
          </Select>
          <Select multiple name="fruits" label="Fruits" defaultValue={[]}>
            <option value="apple">Apple</option>
            <option value="banana">Banana</option>
            <option value="kiwi">Kiwi</option>
          </Select>
          <Textarea label="Description" name="description" />
          <fieldset name="monster" className="flex gap-2">
            <Input label="Kraken" name="monster" type="radio" value="kraken" />
            <Input label="Sasquatch" name="monster" type="radio" value="sasquatch" />
            <Input label="Mothman" name="monster" type="radio" value="mothman" />
          </fieldset>
          <span className="text-sm text-red-500" />
          <button className="rounded border bg-slate-500 p-2">Save</button>
          <span className="text-sm text-gray-500"> * required </span>
        </Form>
      </section>
    </main>
  );
}
