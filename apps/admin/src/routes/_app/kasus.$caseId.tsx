import { createFileRoute } from "@tanstack/react-router";
import { CaseDetail } from "../../modules/cases/case-detail";

export const Route = createFileRoute("/_app/kasus/$caseId")({
  component: CaseDetailRoute,
});

function CaseDetailRoute() {
  const { caseId } = Route.useParams();
  return <CaseDetail caseId={caseId} />;
}
