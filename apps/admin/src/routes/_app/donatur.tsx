import { createFileRoute } from "@tanstack/react-router";
import { DonaturList } from "../../modules/donatur/donatur-list";

export const Route = createFileRoute("/_app/donatur")({
  component: DonaturList,
});
