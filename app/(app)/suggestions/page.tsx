import { getUser } from "@/lib/auth";
import Suggestions from "@/components/Suggestions";

export default async function SuggestionsPage() {
  const user = (await getUser())!;
  return <Suggestions role={user.role} />;
}
