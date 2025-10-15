// // src/pages/api/pdf-process.js
// import { PDFDocument } from 'pdf-lib';

// export async function post({ request }) {
//   const formData = await request.formData();
//   const file = formData.get('pdf');
//   const arrayBuffer = await file.arrayBuffer();
//   const pdfDoc = await PDFDocument.load(arrayBuffer);
//   const numPages = pdfDoc.getPageCount();
//   return new Response(JSON.stringify({ numPages }), {
//     headers: { 'Content-Type': 'application/json' }
//   });
// }
