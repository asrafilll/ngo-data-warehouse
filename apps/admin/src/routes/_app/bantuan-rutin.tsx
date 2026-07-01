import { createFileRoute } from "@tanstack/react-router";
import { RutinRoster } from "../../modules/rutin/rutin-roster";

export const Route = createFileRoute("/_app/bantuan-rutin")({
  component: RutinRoster,
});
