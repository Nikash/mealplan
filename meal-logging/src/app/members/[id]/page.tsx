import { PersonDays } from "@/components/PersonDays";

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PersonDays memberId={id} />;
}
