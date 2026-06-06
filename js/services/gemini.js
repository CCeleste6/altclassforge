(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;

  function buildPrompt(settings) {
    const sourceInstruction = settings.subject
      ? `Matéria principal: ${settings.subject}. Texto de apoio opcional: "${settings.content.substring(0, 2500)}".`
      : `Baseie-se ESTRITAMENTE neste texto: "${settings.content.substring(0, 3500)}".`;

    return `ATUE COMO DESIGNER DE RPG EDUCACIONAL E PROFESSOR.
Tema narrativo da dungeon: ${settings.theme}.
${sourceInstruction}

OBJETIVO: gere JSON PURO com EXATAMENTE ${settings.questionCount} objetos. Cada objeto será uma casa de questão dentro de um roguelike educacional.

REGRAS IMPORTANTES:
1. Cada objeto precisa ter: title, desc, quiz, magic e stealth.
2. title: nome curto e criativo de inimigo, guardião, armadilha ou boss relacionado ao tema.
3. desc: lore curta, misturando o tema RPG e o conteúdo escolar.
4. quiz: pergunta de múltipla escolha com 4 opções e correct como número de 0 a 3.
5. magic: afirmação de verdadeiro/falso com is_true booleano.
6. stealth: pergunta aberta com answer completa e keywords com pelo menos 3 conceitos essenciais.
7. hint: inclua dica útil em quiz, magic e stealth.
8. RIGOR FACTUAL: não invente fatos; confira contas e conceitos.
9. Evite perguntas repetidas.

FORMATO EXATO:
[
  {
    "title": "Guardião ...",
    "desc": "Lore curta...",
    "quiz": {"question": "...", "options": ["A...", "B...", "C...", "D..."], "correct": 0, "hint": "..."},
    "magic": {"statement": "...", "is_true": true, "hint": "..."},
    "stealth": {"question": "...", "answer": "...", "keywords": ["conceito1", "conceito2", "conceito3"], "hint": "..."}
  }
]`;
  }

  function normalizeStage(stage, index) {
    const fallback = CF.Dungeon.getDemoStages(1)[0];
    const quizOptions = Array.isArray(stage.quiz && stage.quiz.options) && stage.quiz.options.length >= 4
      ? stage.quiz.options.slice(0, 4).map(String)
      : fallback.quiz.options;

    return {
      title: String(stage.title || `Guardião ${index + 1}`),
      desc: String(stage.desc || fallback.desc),
      quiz: {
        question: String(stage.quiz && stage.quiz.question || fallback.quiz.question),
        options: quizOptions,
        correct: Utils.correctIndexFromValue(stage.quiz && stage.quiz.correct, quizOptions),
        hint: String(stage.quiz && stage.quiz.hint || 'Elimine as alternativas improváveis.')
      },
      magic: {
        statement: String(stage.magic && stage.magic.statement || fallback.magic.statement),
        is_true: Boolean(stage.magic && stage.magic.is_true),
        hint: String(stage.magic && stage.magic.hint || 'Procure a palavra que torna a frase absoluta demais.')
      },
      stealth: {
        question: String(stage.stealth && stage.stealth.question || fallback.stealth.question),
        answer: String(stage.stealth && stage.stealth.answer || fallback.stealth.answer),
        keywords: Array.isArray(stage.stealth && stage.stealth.keywords) && stage.stealth.keywords.length
          ? stage.stealth.keywords.slice(0, 6).map(String)
          : fallback.stealth.keywords,
        hint: String(stage.stealth && stage.stealth.hint || 'Responda usando os conceitos centrais.')
      }
    };
  }

  function normalizeStages(rawStages, questionCount) {
    if (!Array.isArray(rawStages) || rawStages.length === 0) {
      throw new Error('A IA retornou vazio ou fora do formato esperado.');
    }

    const normalized = rawStages.map(normalizeStage);
    while (normalized.length < questionCount) {
      normalized.push(normalizeStage(normalized[normalized.length - 1], normalized.length));
    }
    return normalized.slice(0, questionCount);
  }

  async function generateStages(settings) {
    const prompt = buildPrompt(settings);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CF.CONFIG.geminiModel}:generateContent?key=${encodeURIComponent(settings.apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data && data.error && data.error.message ? data.error.message : 'Erro desconhecido da API Gemini.';
      throw new Error(message);
    }

    const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts
      ? data.candidates[0].content.parts.map(function (part) { return part.text || ''; }).join('\n')
      : '';

    const parsed = JSON.parse(Utils.cleanJSON(text));
    return normalizeStages(parsed, settings.questionCount);
  }

  CF.Gemini = {
    generateStages: generateStages,
    normalizeStages: normalizeStages
  };
}());
