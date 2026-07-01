import { createFileRoute } from "@tanstack/react-router";
import { MustahikList } from "../../modules/mustahik/mustahik-list";

export const Route = createFileRoute("/_app/mustahik")({
  component: MustahikList,
});
