import { cn } from "@repo/ui/lib/utils";

// SIP brand mark. The logo art is full green, so it sits on a tokenized tile to stay
// legible on both the dark-green sidebar and light surfaces.
export function SipLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-background p-1 ring-1 ring-border",
        className,
      )}
    >
      <img
        alt="Solidaritas Insan Peduli"
        className="size-full object-contain"
        src="/sip_logo.png"
      />
    </span>
  );
}
