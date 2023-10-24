'use client';

import { HTMLAttributes, PropsWithChildren, useEffect, useRef } from 'react';
import { z } from 'zod';
import { PartialDeep } from 'type-fest';
import { setFormDataToForm, objectToFormData, setRequiresToForm } from '@vardario/zod-form-validation';

export interface FormProps<TSchema extends z.ZodSchema, TData = unknown>
  extends PropsWithChildren<HTMLAttributes<HTMLFormElement>> {
  schema?: TSchema;
  data?: PartialDeep<TData>;
}

export default function Form<TSchema extends z.ZodSchema, TData = z.infer<TSchema>>({
  children,
  schema,
  data,
  ...props
}: FormProps<TSchema, TData>) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (schema) setRequiresToForm(formRef.current!, schema);
  }, [formRef, schema]);

  useEffect(() => {
    if (data && schema && formRef.current) {
      setFormDataToForm(formRef.current!, objectToFormData(data));
    }
  }, [formRef, data, schema]);

  return (
    <form ref={formRef} {...props}>
      {children}
    </form>
  );
}
