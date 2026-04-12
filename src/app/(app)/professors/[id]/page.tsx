import { ProfessorDetailPage } from "@/components/professors/professor-detail-page";

export default async function ProfessorRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProfessorDetailPage professorId={id} />;
}
