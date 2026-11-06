"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Field } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { DEFAULT_PROPERTY, FEATURES, propertySchema, type PropertyInput } from "@/lib/features";

interface Props {
  /** Replace the form contents (e.g. when the user picks a history entry). */
  values?: PropertyInput;
  onSubmit: (p: PropertyInput) => Promise<unknown>;
  onAddToCompare: (p: PropertyInput) => void;
  basketFull: boolean;
}

export function PropertyForm({ values, onSubmit, onAddToCompare, basketFull }: Props) {
  const {
    register, handleSubmit, reset, setError, getValues, trigger,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: { ...DEFAULT_PROPERTY, label: "" },
    mode: "onBlur", // validate when leaving a field, then live once it has an error
  });

  useEffect(() => { if (values) reset(values); }, [values, reset]);

  const submit = handleSubmit(async (data) => {
    try {
      await onSubmit({ ...data, label: data.label?.trim() || undefined });
    } catch (e) {
      // Surface server-side validation next to the offending field.
      if (e instanceof ApiError && Object.keys(e.fields).length) {
        for (const [field, message] of Object.entries(e.fields)) setError(field as keyof PropertyInput, { message });
      } else {
        setError("root", { message: e instanceof Error ? e.message : "Unexpected error" });
      }
    }
  });

  const addToCompare = async () => {
    if (await trigger()) onAddToCompare(propertySchema.parse(getValues()));
  };

  return (
    <form onSubmit={submit} noValidate aria-describedby={errors.root ? "form-error" : undefined}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Label (optional)" placeholder="e.g. Oakland duplex" maxLength={60} error={errors.label?.message} {...register("label")} />
        </div>
        {FEATURES.map((f) => (
          <Field
            key={f.key}
            label={f.label}
            unit={f.unit}
            hint={f.hint}
            type="number"
            inputMode="decimal"
            step="any"
            error={errors[f.key]?.message}
            {...register(f.key, { valueAsNumber: true })}
          />
        ))}
      </div>

      {errors.root && <p id="form-error" role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-800">{errors.root.message}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" loading={isSubmitting}>Estimate value</Button>
        <Button type="button" variant="secondary" onClick={addToCompare} disabled={basketFull}>
          {basketFull ? "Comparison basket full" : "Add to comparison"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => reset({ ...DEFAULT_PROPERTY, label: "" })}>Reset</Button>
      </div>
    </form>
  );
}
