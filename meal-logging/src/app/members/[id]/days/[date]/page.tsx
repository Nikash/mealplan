import { DayEdit } from "@/components/DayEdit";

export default async function DayPage({
  params,
}: {
  params: Promise<{ id: string; date: string }>;
}) {
  const { id, date } = await params;
  return <DayEdit memberId={id} date={date} />;
}
