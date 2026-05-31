import { redirect } from "next/navigation";

/** Legacy route — Plan page picks first visible tab if Goals is hidden. */
export default function PlanningPage() {
  redirect("/plan?tab=goals");
}
