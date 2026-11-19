import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import Insights from "@/components/Insights";

export default async function InsightsPage() {
  const user = (await getUser())!;
  if (user.role === "student") redirect("/dashboard");
  return <Insights role={user.role} />;
}
