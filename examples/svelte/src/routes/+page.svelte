<script lang="ts">
  import { z } from 'zod';
  import { Input, Select, Form, Textarea, Fieldset } from '$lib/index.js';
  import { parseFormData } from '@vardario/zod-form-validation';
  import { schema } from '$lib/schema.js';

  function submit(event: Event) {
    const result = parseFormData(new FormData(event.target! as HTMLFormElement), schema);
    if (result.success) {
      alert(JSON.stringify(result.data, null, 2));
    }
  }
</script>

<main>
  <section class="flex min-h-screen">
    <Form class="m-auto flex w-1/3 flex-col gap-2 rounded border p-4" {schema} on:submit={submit}>
      <Input label="Admin" name="admin" type="checkbox" />
      <Input label="Given Name" name="givenName" />
      <Input label="Surname" name="surname" />
      <Input label="Birthday" name="birthday" type="date" />
      <Input label="Amount" name="amount" type="number" />
      <Input label="Range" name="range" type="range" min="0" max="100" step="1" />
      <div class="flex flex-col rounded border p-2">
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
      <Fieldset label="Monster" name="monster">
        <Input label="Kraken" name="monster.value" type="radio" value="kraken" />
        <Input label="Sasquatch" name="monster.value" type="radio" value="sasquatch" />
        <Input label="Mothman" name="monster.value" type="radio" value="mothman" />
      </Fieldset>
      <span class="text-sm text-red-500" />
      <button class="rounded border bg-slate-500 p-2">Save</button>
      <span class="text-sm text-gray-500"> * required </span>
    </Form>
  </section>
</main>
