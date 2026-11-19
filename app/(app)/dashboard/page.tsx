import { getUser } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";

export default async function DashboardPage() {
  const user = (await getUser())!;
  return <Dashboard user={user} />;
}
