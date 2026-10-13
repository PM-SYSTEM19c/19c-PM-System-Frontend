import { ClipboardList } from "lucide-react";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <ClipboardList className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-extrabold tracking-tight sm:text-base">
          PM System
        </span>
      </span>
    </div>
  );
}
