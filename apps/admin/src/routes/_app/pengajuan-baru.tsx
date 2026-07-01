import { createFileRoute } from "@tanstack/react-router";
import { PengajuanForm } from "../../modules/pengajuan/pengajuan-form";

export const Route = createFileRoute("/_app/pengajuan-baru")({
  component: PengajuanForm,
});
