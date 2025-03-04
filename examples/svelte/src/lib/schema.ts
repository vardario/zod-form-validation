import z from 'zod';

const petsSchema = z.enum(['dog', 'cat', 'hamster', 'parrot', 'spider', 'goldfish']);
const monsterSchema = z.enum(['kraken', 'sasquatch', 'mothman']);
const fruits = z.enum(['apple', 'banana', 'kiwi']);

export const typeASchema = z.object({
  type: z.literal('A'),
  a: z.number()
});

export const typeBSchema = z.object({
  type: z.literal('B'),
  a: z.string(),
  b: z.number().optional()
});

export const discriminatedUnionSchema = z.discriminatedUnion('type', [typeASchema, typeBSchema]);

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
  }),
  dynamicObject: discriminatedUnionSchema
});

export type ObjectData = z.infer<typeof schema>;
