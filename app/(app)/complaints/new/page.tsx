import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import NewComplaintForm from "@/components/NewComplaintForm";

export default async function NewComplaintPage() {
  const user = (await getUser())!;
  if (user.role !== "student") redirect("/dashboard");
  return <NewComplaintForm />;
}
