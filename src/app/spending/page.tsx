import { redirect } from "next/navigation";

/** Legacy route — Plan page picks first visible tab if Budget is hidden. */
export default function SpendingPage() {
  redirect("/plan?tab=budget");
}
