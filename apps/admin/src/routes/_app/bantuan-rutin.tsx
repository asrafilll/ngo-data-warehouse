import { createFileRoute } from "@tanstack/react-router";
import { RutinRoster } from "../../modules/rutin/rutin-roster";

export const Route = createFileRoute("/_app/bantuan-rutin")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): { page?: number } => {
    const page = Number(search.page);
    return Number.isFinite(page) && page > 1 ? { page } : {};
  },
});

function RouteComponent() {
  const { page = 1 } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RutinRoster
      onPageChange={(next) =>
        navigate({ search: (prev) => ({ ...prev, page: next > 1 ? next : undefined }) })
      }
      page={page}
    />
  );
}
