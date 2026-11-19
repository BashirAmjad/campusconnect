import { pageUser } from "@/lib/auth";
import Suggestions from "@/components/Suggestions";

export default async function SuggestionsPage() {
  const user = await pageUser();
  return <Suggestions role={user.role} />;
}
