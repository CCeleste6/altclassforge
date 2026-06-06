(function () {
  window.CF = window.CF || {};

  function questionNodes() {
    return CF.State.getRun().nodes.filter(function (node) {
      return node.kind === 'battle' || node.kind === 'boss';
    });
  }

  function addWrappedText(doc, text, x, y, maxWidth, lineHeight, pageHeight) {
    const lines = doc.splitTextToSize(String(text || ''), maxWidth);
    lines.forEach(function (line) {
      if (y > pageHeight) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, x, y);
      y += lineHeight;
    });
    return y;
  }

  function exportPDF() {
    const run = CF.State.getRun();
    const nodes = questionNodes();
    if (!nodes.length) {
      alert('Gere uma dungeon primeiro.');
      return;
    }
    if (!window.jspdf) {
      alert('jsPDF não carregou. Verifique a conexão com a internet.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = 190;
    const pageHeight = 280;
    let y = 20;

    doc.setFontSize(18);
    doc.text('CLASS FORGE - ATIVIDADE ROGUELIKE', 10, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`Matéria: ${run.meta.subject || 'Modo livre'} | Tema: ${run.meta.theme || '-'}`, 10, y);
    y += 7;
    doc.text('Aluno: ________________________________  Data: ____/____/______', 10, y);
    y += 14;

    nodes.forEach(function (node, index) {
      const stage = run.stages[node.stageIndex];
      const mode = node.kind === 'boss' ? 'boss' : node.mode;
      if (y > 255) { doc.addPage(); y = 20; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${node.title} (${mode})`, 10, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      if (node.kind === 'boss') {
        y = addWrappedText(doc, `Quiz: ${stage.quiz.question}`, 10, y, pageWidth, 5, pageHeight);
        stage.quiz.options.forEach(function (option) { doc.text(`[   ] ${option}`, 15, y); y += 6; });
        y = addWrappedText(doc, `V/F: ${stage.magic.statement}`, 10, y + 2, pageWidth, 5, pageHeight);
        doc.text('[   ] Verdadeiro    [   ] Falso', 15, y); y += 8;
        y = addWrappedText(doc, `Aberta: ${stage.stealth.question}`, 10, y, pageWidth, 5, pageHeight);
        doc.text('Resposta: ______________________________________________________', 15, y + 4); y += 14;
      } else if (node.mode === 'quiz') {
        y = addWrappedText(doc, stage.quiz.question, 10, y, pageWidth, 5, pageHeight);
        stage.quiz.options.forEach(function (option) { doc.text(`[   ] ${option}`, 15, y); y += 6; });
      } else if (node.mode === 'magic') {
        y = addWrappedText(doc, stage.magic.statement, 10, y, pageWidth, 5, pageHeight);
        doc.text('[   ] Verdadeiro    [   ] Falso', 15, y); y += 8;
      } else {
        y = addWrappedText(doc, stage.stealth.question, 10, y, pageWidth, 5, pageHeight);
        doc.text('Resposta: ______________________________________________________', 15, y + 4); y += 12;
      }
      y += 8;
    });

    doc.addPage();
    y = 20;
    doc.setFontSize(18);
    doc.text('GABARITO - USO DO PROFESSOR', 10, y);
    y += 14;
    nodes.forEach(function (node, index) {
      const stage = run.stages[node.stageIndex];
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${node.title}`, 10, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 130, 0);
      if (node.kind === 'boss') {
        doc.text(`Quiz: ${stage.quiz.options[stage.quiz.correct]}`, 14, y); y += 6;
        doc.text(`V/F: ${stage.magic.is_true ? 'Verdadeiro' : 'Falso'}`, 14, y); y += 6;
        y = addWrappedText(doc, `Aberta: ${stage.stealth.answer}`, 14, y, 180, 5, 280);
      } else if (node.mode === 'quiz') {
        doc.text(`Resposta: ${stage.quiz.options[stage.quiz.correct]}`, 14, y); y += 7;
      } else if (node.mode === 'magic') {
        doc.text(`Resposta: ${stage.magic.is_true ? 'Verdadeiro' : 'Falso'}`, 14, y); y += 7;
      } else {
        y = addWrappedText(doc, `Resposta esperada: ${stage.stealth.answer}`, 14, y, 180, 5, 280);
        y = addWrappedText(doc, `Palavras-chave: ${stage.stealth.keywords.join(', ')}`, 14, y, 180, 5, 280);
      }
      doc.setTextColor(0, 0, 0);
      y += 6;
    });

    doc.save('class_forge_roguelike_prova.pdf');
  }

  CF.PdfExporter = {
    exportPDF: exportPDF
  };
}());
