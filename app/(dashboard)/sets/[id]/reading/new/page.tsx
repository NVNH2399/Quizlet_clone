import NewPassageManual from "./new-passage-manual";

export default async function NewPassagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NewPassageManual setId={id} />;
}