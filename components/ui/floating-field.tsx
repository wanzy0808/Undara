"use client";

import { cloneElement, useId, type ComponentProps, type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { displayTitleCase } from "@/lib/text/display-title-case";

type ControlProps = ComponentProps<"input"> | ComponentProps<"select"> | ComponentProps<"textarea">;
type FloatingFieldProps = Omit<ComponentProps<"label">, "children"> & {
  label: string;
  children: ReactElement<ControlProps>;
};

/** Keep the original control, ref, validation and handlers; only its label moves. */
export function FloatingField({ label, children, className, htmlFor, ...props }: FloatingFieldProps) {
  const generatedId = useId();
  const control = children.props;
  const id = control.id ?? htmlFor ?? generatedId;
  const value = control.value ?? control.defaultValue;
  const filled = Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && String(value) !== "";
  const select = children.type === "select";
  const filledSelect = select && (filled || control.value === undefined);

  return (
    <label
      {...props}
      htmlFor={id}
      className={cn("undara-floating-field", className)}
      data-filled={filledSelect || undefined}
      data-empty-select={select && !filledSelect || undefined}
    >
      {cloneElement(children, {
        id,
        className: cn(control.className, "undara-floating-control"),
        ...(!select ? { placeholder: "placeholder" in control ? control.placeholder || " " : " " } : {}),
      })}
      <span className="undara-floating-label">{displayTitleCase(label)}</span>
    </label>
  );
}
