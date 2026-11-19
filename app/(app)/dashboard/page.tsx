import { pageUser } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";

export default async function DashboardPage() {
  const user = await pageUser();
  return <Dashboard user={user} />;
}
