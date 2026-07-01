import { createFileRoute } from "@tanstack/react-router";
import { Pengaturan } from "../../modules/pengaturan/pengaturan";

export const Route = createFileRoute("/_app/pengaturan")({
  component: Pengaturan,
});
