import { pageUser } from "@/lib/auth";
import ComplaintsList from "@/components/ComplaintsList";

export default async function ComplaintsPage() {
  const user = await pageUser();
  return <ComplaintsList user={user} />;
}
