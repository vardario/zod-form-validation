import z from 'zod';

const petsSchema = z.enum(['dog', 'cat', 'hamster', 'parrot', 'spider', 'goldfish']);
const monsterSchema = z.enum(['kraken', 'sasquatch', 'mothman']);
const fruits = z.enum(['apple', 'banana', 'kiwi']);

export const schema = z.object({
  admin: z.boolean().refine(val => val === true, {
    message: 'Please read and accept the terms and conditions'
  }),
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
  amount: z.bigint(),
  range: z.number(),
  pet: petsSchema,
  fruits: z.array(fruits),
  description: z.string(),
  monster: z.object({
    value: monsterSchema
  })
});
