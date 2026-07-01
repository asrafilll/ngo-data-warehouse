import { createFileRoute } from "@tanstack/react-router";
import { ProgramManager } from "../../modules/programs/program-manager";

export const Route = createFileRoute("/_app/program")({
  component: ProgramManager,
});
