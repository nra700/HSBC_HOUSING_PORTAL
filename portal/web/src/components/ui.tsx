"use client";

/** Shared design-system primitives used by both applications. */
import clsx from "clsx";
import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-slate-600">
      <svg className="h-4 w-4 animate-spin motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span>{label}…</span>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("animate-pulse rounded-md bg-slate-200 motion-reduce:animate-none", className)} />;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
};
const variants = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 disabled:bg-slate-400",
  secondary: "bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50 disabled:text-slate-400",
  danger: "bg-white text-red-700 ring-1 ring-red-300 hover:bg-red-50 disabled:text-slate-400",
  ghost: "text-brand-700 hover:bg-brand-50 disabled:text-slate-400",
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", loading, className, children, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700",
        "disabled:cursor-not-allowed", variants[variant], className)}
      {...rest}
    >
      {loading && <Spinner label="" />}
      {children}
    </button>
  );
});

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section aria-labelledby={title ? id : undefined} className={clsx("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 id={id} className="text-base font-semibold text-slate-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; unit?: string };
/** Labelled input; wires up aria-describedby / aria-invalid so errors are announced to screen readers. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, hint, error, unit, className, ...rest }, ref) {
  const id = useId();
  const hintId = `${id}-hint`, errId = `${id}-err`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {label} {unit && <span className="font-normal text-slate-600">({unit})</span>}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={clsx(hint && hintId, error && errId) || undefined}
        className={clsx(
          "mt-1 w-full rounded-md border px-3 py-2 text-sm text-slate-900 shadow-sm",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-700",
          error ? "border-red-600 bg-red-50" : "border-slate-300 bg-white", className)}
        {...rest}
      />
      {hint && <p id={hintId} className="mt-1 text-xs text-slate-600">{hint}</p>}
      {error && <p id={errId} role="alert" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
});

export function ErrorState({ title = "Something went wrong", message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
      <h2 className="font-semibold">{title}</h2>
      {message && <p className="mt-1 text-sm">{message}</p>}
      {onRetry && <Button variant="secondary" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {description && <p className="mt-1 max-w-2xl text-slate-700">{description}</p>}
    </header>
  );
}
