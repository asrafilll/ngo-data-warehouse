import { createFileRoute } from "@tanstack/react-router";
import { CaseList } from "../../modules/cases/case-list";

export const Route = createFileRoute("/_app/bantuan-insidental")({
  component: CaseList,
});
