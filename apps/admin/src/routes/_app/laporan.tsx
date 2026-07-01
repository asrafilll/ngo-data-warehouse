import { createFileRoute } from "@tanstack/react-router";
import { Laporan } from "../../modules/laporan/laporan";

export const Route = createFileRoute("/_app/laporan")({
  component: Laporan,
});
