import ImportExcel from "./import-excel";
import ImportPDF from "./import-pdf";

export default async function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Import thẻ hàng loạt</h1>
      <ImportExcel setId={id} />
      <ImportPDF setId={id} />
    </div>
  );
}