import { pageUser } from "@/lib/auth";
import ComplaintDetail from "@/components/ComplaintDetail";

export default async function ComplaintPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await pageUser();
  const { id } = await params;
  return <ComplaintDetail user={user} id={id} />;
}
