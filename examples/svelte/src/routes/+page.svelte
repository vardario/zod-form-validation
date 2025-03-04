<script lang="ts">
  import { Input, Select, Form, Textarea, Fieldset } from '$lib/index.js';
  import { parseFormData } from '@vardario/zod-form-validation';
  import { type ObjectData, schema } from '$lib/schema.js';
  import type { PartialDeep } from 'type-fest';

  function submit(event: Event) {
    const result = parseFormData(new FormData(event.target! as HTMLFormElement), schema);
    if (result.success) {
      alert(JSON.stringify(result.data, null, 2));
    }
  }

  let data: PartialDeep<ObjectData> = {
    dynamicObject: {
      type: 'A'
    }
  };
</script>

<main>
  <section class="flex min-h-screen">
    <Form
      class="m-auto flex w-1/3 flex-col gap-2 rounded border p-4"
      {schema}
      on:submit={submit}
      onChange={_data => (data = _data)}
    >
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

      <div class="flex flex-col rounded border p-2 gap-2">
        <Select name="dynamicObject.type" label="Type">
          <option value="A">A</option>
          <option value="B">B</option>
        </Select>

        {#if data?.dynamicObject?.type === 'A'}
          <Input label="A" name="dynamicObject.a" type="number" />
        {:else if data?.dynamicObject?.type === 'B'}
          <Input label="A" name="dynamicObject.a" />
          <Input label="B" name="dynamicObject.b" />
        {/if}
      </div>

      <span class="text-sm text-red-500" />
      <button class="rounded border bg-slate-500 p-2">Save</button>
      <span class="text-sm text-gray-500"> * required </span>
    </Form>
  </section>
</main>
