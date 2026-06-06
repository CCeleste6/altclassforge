(function () {
  window.CF = window.CF || {};

  async function readPDF(file) {
    if (!window.pdfjsLib) throw new Error('PDF.js não carregou. Verifique a conexão com a internet.');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, CF.CONFIG.maxPdfPages);
    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(function (item) { return item.str; }).join(' ') + ' ';
    }
    return fullText.trim();
  }

  async function readTextFile(file) {
    return file.text();
  }

  async function readUploadedFile(file) {
    if (!file) return '';
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return readPDF(file);
    if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt')) return readTextFile(file);
    throw new Error('Formato não suportado. Use PDF ou TXT.');
  }

  CF.PdfReader = {
    readUploadedFile: readUploadedFile
  };
}());
