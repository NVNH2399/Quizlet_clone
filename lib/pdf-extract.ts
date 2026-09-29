import * as pdfjsLib from "pdfjs-dist";

// Trỏ tới worker của pdfjs — bắt buộc, nếu thiếu sẽ lỗi khi parse PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Nối các item text lại thành dòng — pdf.js trả về từng cụm text rời rạc,
    // không có sẵn khái niệm "dòng" rõ ràng như file text thường
    const pageText = content.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}