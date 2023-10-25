'use client';

import { observerValidationErrors } from '@vardario/zod-form-validation';
import { InputHTMLAttributes, PropsWithChildren, SelectHTMLAttributes, useEffect, useRef, useState } from 'react';

export interface SelectProps extends PropsWithChildren<SelectHTMLAttributes<HTMLSelectElement>> {
  label?: string;
}

export default function Select({ label, children, ...props }: SelectProps) {
  const [errors, setError] = useState<string[]>([]);
  const inputRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    observerValidationErrors(inputRef.current!, (_errors) => {
      setError(_errors);
    });
  }, [inputRef]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col-reverse gap-2">
        <select
          ref={inputRef}
          className="peer rounded p-2 outline-none outline-1 valid:border invalid:outline invalid:outline-red-600"
          id={props.name}
          {...props}
        >
          {children}
        </select>
        {label && (
          <label
            className="text-sm after:text-red-500 peer-invalid:text-red-500 peer-data-[validation-required=true]:after:content-['*']"
            htmlFor={props.name}
          >
            {label}
          </label>
        )}
      </div>
      {errors.map((error, index) => (
        <span key={index} className="text-sm text-red-600">
          {error}
        </span>
      ))}
      <div />
    </div>
  );
}
