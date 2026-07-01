// Reusable table pagination — 10 rows/page. Page lives in the route's URL search param
// (wired per-route), so navigating into a detail and back preserves the page.
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 10;

export function paginate<T>(rows: T[], page: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * PAGE_SIZE;
  return {
    pageRows: rows.slice(start, start + PAGE_SIZE),
    pageCount,
    page: current,
    from: rows.length === 0 ? 0 : start + 1,
    to: Math.min(start + PAGE_SIZE, rows.length),
    total: rows.length,
  };
}

export function TablePagination({
  page,
  pageCount,
  from,
  to,
  total,
  onPageChange,
  label = "data",
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <span className="text-muted-foreground text-xs">
        Menampilkan <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> dari {total} {label}
      </span>
      {pageCount > 1 ? (
        <div className="flex items-center gap-1">
          <Button
            aria-label="Halaman sebelumnya"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <ChevronLeft className="size-4" strokeWidth={1.8} />
          </Button>
          {pageCount <= 7 ? (
            Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <Button
                className={cn("min-w-8 tabular-nums", p === page && "pointer-events-none")}
                key={p}
                onClick={() => onPageChange(p)}
                size="icon-sm"
                type="button"
                variant={p === page ? "default" : "ghost"}
              >
                {p}
              </Button>
            ))
          ) : (
            <span className="px-2 text-muted-foreground text-xs tabular-nums">
              Hal. {page} / {pageCount}
            </span>
          )}
          <Button
            aria-label="Halaman berikutnya"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <ChevronRight className="size-4" strokeWidth={1.8} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
