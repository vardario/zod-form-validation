<script lang="ts">
  import { z } from "zod";
  import { Input, Select, Form, Textarea } from "$lib/index.js";

  const petsSchema = z.enum([
    "dog",
    "cat",
    "hamster",
    "parrot",
    "spider",
    "goldfish",
  ]);

  const monsterSchema = z.enum(["kraken", "sasquatch", "mothman"]);
  const fruits = z.enum(["apple", "banana", "kiwi"]);

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
          confirmEmail: z.string().email(),
        })
        .superRefine(({ email, confirmEmail }, context) => {
          if (email !== confirmEmail) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: "E-Mail does not match",
              path: ["confirmEmail"],
            });
          }
        }),
    }),
    amount: z.bigint(),
    range: z.number(),
    pet: petsSchema,
    fruits: z.array(fruits),
    description: z.string(),
    monster: monsterSchema,
  });
</script>

<main>
  <section class="min-h-screen flex">
    <Form class="flex gap-2 flex-col m-auto border p-4 rounded w-1/3" {schema}>
      <Input label="Admin" name="admin" type="checkbox" />
      <Input label="Given Name" name="givenName" />
      <Input label="Surname" name="surname" />
      <Input label="Birthday" name="birthday" type="date" />
      <Input label="Amount" name="amount" type="number" />
      <Input
        label="Range"
        name="range"
        type="range"
        min="0"
        max="100"
        step="1"
      />
      <div class="p-2 border rounded flex flex-col">
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
      <Select multiple name="fruits" label="Fruits" value="">
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
        <option value="kiwi">Kiwi</option>
      </Select>
      <Textarea label="Description" name="description" />
      <fieldset name="monster" class="flex gap-2">
        <Input label="Kraken" name="monster" type="radio" value="kraken" />
        <Input
          label="Sasquatch"
          name="monster"
          type="radio"
          value="sasquatch"
        />
        <Input label="Mothman" name="monster" type="radio" value="mothman" />
      </fieldset>
      <span class="text-red-500 text-sm" />
      <button class="p-2 border rounded bg-slate-500">Save</button>
      <span class="text-gray-500 text-sm"> * required </span>
    </Form>
  </section>
</main>
