"use client";

import { observerValidationErrors } from "@vardario/zod-form-validation";
import { InputHTMLAttributes, useEffect, useRef, useState } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, ...props }: InputProps) {
  const [errors, setError] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    observerValidationErrors(inputRef.current!, (_errors) => {
      setError(_errors);
    });
  }, [inputRef]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col-reverse gap-2">
        <input
          ref={inputRef}
          className="p-2 valid:border rounded outline-none invalid:outline invalid:outline-red-600 outline-1 peer"
          id={props.name}
          {...props}
        />
        {label && (
          <label
            className="peer-data-[validation-required=true]:after:content-['*'] after:text-red-500 peer-invalid:text-red-500 text-sm"
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
