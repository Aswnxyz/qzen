"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { inputClass, labelClass } from "./styles";

/** Label + control group. Keeps every customer form on the same rhythm. */
export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint ? (
        <div className="mt-2 flex justify-end text-right">{hint}</div>
      ) : null}
    </div>
  );
}

const eyeIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const eyeOffIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1" />
    <path d="M6.6 6.6A16.7 16.7 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4.4-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  /** How long the plaintext stays visible before masking again (ms). */
  revealDuration?: number;
  hint?: ReactNode;
}

/**
 * Password input with the shared reveal/mask micro-interaction.
 * The behaviour mirrors the original inline implementations exactly.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
  maxLength,
  revealDuration = 1000,
  hint,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timeout = timeoutRef.current;

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  function reveal() {
    setVisible(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, revealDuration);
  }

  return (
    <Field id={id} label={label} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          className={`${inputClass} pr-12`}
        />

        <button
          type="button"
          onClick={() => (visible ? setVisible(false) : reveal())}
          aria-label={
            visible ? "Hide password" : "Show password for 1 second"
          }
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-text-3 transition hover:bg-paper-2 hover:text-ink-text"
        >
          {visible ? eyeOffIcon : eyeIcon}
        </button>
      </div>
    </Field>
  );
}
