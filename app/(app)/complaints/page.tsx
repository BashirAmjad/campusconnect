import { getUser } from "@/lib/auth";
import ComplaintsList from "@/components/ComplaintsList";

export default async function ComplaintsPage() {
  const user = (await getUser())!;
  return <ComplaintsList user={user} />;
}
