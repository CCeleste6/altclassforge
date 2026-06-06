(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;
  const CONFIG = CF.CONFIG;

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

  function sourceForType(stage, type) {
    if (type === 'multiple') return stage.multiple;
    if (type === 'scientific') return stage.scientific;
    if (type === 'quick') return stage.quick;
    return stage.standard;
  }

  function bossTypes(node) {
    return node.kind === 'boss' ? (node.bossSteps || ['standard', 'multiple', 'scientific', 'quick']) : [node.questionType || 'standard'];
  }

  function addQuestion(doc, run, node, type, number, y, pageWidth, pageHeight) {
    const stage = run.stages[node.stageIndex];
    const typeConfig = CONFIG.questionTypes[type] || CONFIG.questionTypes.standard;
    const source = sourceForType(stage, type);

    if (y + 18 > pageHeight) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`${number}. ${node.title} - ${typeConfig.label}`, 10, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (type === 'scientific') {
      y = addWrappedText(doc, `Enunciado: ${source.context}`, 10, y, pageWidth, 5, pageHeight);
      y = addWrappedText(doc, `Dados vitais: ${(source.vitalInfo || []).join(' | ')}`, 10, y, pageWidth, 5, pageHeight);
    }

    const question = type === 'multiple' ? source.question : source.question;
    y = addWrappedText(doc, question, 10, y, pageWidth, 5, pageHeight);
    y += 2;

    if (type === 'multiple') {
      (source.statements || []).forEach(function (statement, index) {
        if (y > pageHeight) { doc.addPage(); y = 20; }
        y = addWrappedText(doc, `[   ] V   [   ] F   ${Utils.letter(index)}) ${statement.text}`, 15, y, pageWidth - 5, 5, pageHeight);
      });
    } else {
      (source.options || []).forEach(function (option, index) {
        if (y > pageHeight) { doc.addPage(); y = 20; }
        y = addWrappedText(doc, `[   ] ${Utils.letter(index)}) ${option}`, 15, y, pageWidth - 5, 5, pageHeight);
      });
    }

    y += 8;
    return y;
  }

  function addAnswer(doc, run, node, type, number, y, pageHeight) {
    const stage = run.stages[node.stageIndex];
    const typeConfig = CONFIG.questionTypes[type] || CONFIG.questionTypes.standard;
    const source = sourceForType(stage, type);

    if (y > pageHeight) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${number}. ${node.title} - ${typeConfig.short}`, 10, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 120, 0);
    if (type === 'multiple') {
      const answer = (source.statements || []).map(function (statement, index) {
        return `${Utils.letter(index)}: ${statement.is_true ? 'V' : 'F'}`;
      }).join(' | ');
      doc.text(`Resposta: ${answer}`, 15, y);
    } else {
      const correct = Number(source.correct || 0);
      doc.text(`Resposta: ${Utils.letter(correct)}) ${source.options[correct] || ''}`, 15, y);
    }
    doc.setTextColor(0, 0, 0);
    y += 9;
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
    let number = 1;

    doc.setFontSize(18);
    doc.text('CLASS FORGE - ATIVIDADE ROGUELIKE', 10, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} | Aluno: _______________________`, 10, y);
    y += 7;
    doc.text(`Classe: ${run.meta.emblemEquipped ? 'Grao-Mestre' : run.meta.classLabel} | Materia: ${run.meta.subject}`, 10, y);
    y += 12;

    nodes.forEach(function (node) {
      bossTypes(node).forEach(function (type) {
        y = addQuestion(doc, run, node, type, number, y, pageWidth, pageHeight);
        number += 1;
      });
    });

    doc.addPage();
    y = 20;
    number = 1;
    doc.setFontSize(18);
    doc.text('GABARITO (USO DO PROFESSOR)', 10, y);
    y += 15;

    nodes.forEach(function (node) {
      bossTypes(node).forEach(function (type) {
        y = addAnswer(doc, run, node, type, number, y, pageHeight);
        number += 1;
      });
    });

    doc.save('class_forge_atividade_roguelike.pdf');
  }

  CF.PdfExporter = {
    exportPDF: exportPDF
  };
}());
