import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "../modules/dashboard/dashboard";

export const Route = createFileRoute("/")({
  component: Dashboard,
});
