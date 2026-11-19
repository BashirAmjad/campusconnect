import { redirect } from "next/navigation";
import { pageUser } from "@/lib/auth";
import NewComplaintForm from "@/components/NewComplaintForm";

export default async function NewComplaintPage() {
  const user = await pageUser();
  if (user.role !== "student") redirect("/dashboard");
  return <NewComplaintForm />;
}
