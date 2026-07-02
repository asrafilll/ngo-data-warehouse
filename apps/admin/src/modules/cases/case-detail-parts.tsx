import { workflowSteps } from "@repo/sip-domain";
import { Label } from "@repo/ui/components/label";
import { cn } from "@repo/ui/lib/utils";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

export function Stepper({ currentIndex }: { currentIndex: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3 rounded-xl border bg-background p-4">
      {workflowSteps.map((step, i) => {
        const done = currentIndex >= 0 && i < currentIndex;
        const active = i === currentIndex;
        return (
          <div className="flex items-center gap-2" key={step.status}>
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border text-xs tabular-nums",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={2.5} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
            {i < workflowSteps.length - 1 ? <span className="mx-1 h-px w-6 bg-border" /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function FormField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function Item({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-0.5", className)}>
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", strong ? "font-semibold" : "font-medium")}>{value}</span>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-background p-10 text-center">
      <p className="mx-auto max-w-md text-muted-foreground text-sm">{text}</p>
    </div>
  );
}
