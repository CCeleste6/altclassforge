(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;

  function buildPrompt(settings) {
    const sourceInstruction = settings.subject && settings.subject !== 'Modo livre'
      ? `Matéria principal: ${settings.subject}. Texto de apoio opcional: "${settings.content.substring(0, 2500)}".`
      : `Baseie-se ESTRITAMENTE neste texto: "${settings.content.substring(0, 3500)}".`;

    const classInstruction = settings.emblemEquipped
      ? 'Classe equipada: EMBLEMA DO GRÃO-MESTRE. Evite Questões Padrão. Dê preferência a Questões Múltiplas, Científicas e Rápidas.'
      : `Classe escolhida: ${settings.classId}. Guerreiro = equilibrado; Arqueiro = mais foco em Questões Múltiplas; Ladino = mais Questões Rápidas; Mago = mais Questões Científicas.`;

    return `ATUE COMO DESIGNER DE RPG EDUCACIONAL E PROFESSOR.
${sourceInstruction}
${classInstruction}

OBJETIVO: gere JSON PURO com EXATAMENTE ${settings.questionCount} objetos. Cada objeto será uma casa de questão de uma dungeon roguelike educacional.

TIPOS DE QUESTÃO OBRIGATÓRIOS EM CADA OBJETO:
1. standard = Questão Padrão com 4 alternativas.
2. multiple = Questão Múltipla com afirmações para marcar como Verdadeiras ou Falsas.
3. scientific = Questão Científica com enunciado elaborado e informações vitais.
4. quick = Questão Rápida simples, com tempo sugerido.

REGRAS IMPORTANTES:
- title: nome curto e criativo de inimigo, guardião, armadilha ou boss.
- desc: lore curta misturando RPG e conteúdo escolar.
- correct deve ser número de 0 a 3.
- multiple.statements deve ter 3 ou 4 afirmações com is_true booleano.
- scientific.vitalInfo deve ser array com dados essenciais do enunciado.
- quick.seconds deve ser entre 15 e 30.
- RIGOR FACTUAL: não invente fatos; confira contas e conceitos.
- Evite perguntas repetidas.

FORMATO EXATO:
[
  {
    "title": "Guardião ...",
    "desc": "Lore curta...",
    "standard": {"question": "...", "options": ["A...", "B...", "C...", "D..."], "correct": 0, "hint": "..."},
    "multiple": {"question": "Marque V ou F.", "statements": [{"text": "...", "is_true": true}, {"text": "...", "is_true": false}, {"text": "...", "is_true": true}], "hint": "..."},
    "scientific": {"context": "Enunciado grande...", "vitalInfo": ["dado 1", "dado 2", "dado 3"], "question": "...", "options": ["A...", "B...", "C...", "D..."], "correct": 1, "hint": "..."},
    "quick": {"question": "...", "options": ["A...", "B...", "C...", "D..."], "correct": 2, "hint": "...", "seconds": 20}
  }
]`;
  }

  function normalizeStage(stage, index) {
    return CF.Dungeon.normalizeStage(stage, index);
  }

  function friendlyGeminiError(status, bodyText) {
    if (status === 503) return 'Gemini retornou HTTP 503. Isso costuma ser indisponibilidade temporária/sobrecarga do serviço.';
    if (status === 429) return 'Gemini retornou HTTP 429. Limite de uso atingido ou muitas requisições em pouco tempo.';
    if (status === 401 || status === 403) return 'Gemini recusou a API Key. Verifique se a chave está correta e habilitada.';
    if (status === 400) return 'Gemini recusou a requisição. O prompt/conteúdo pode ter vindo grande demais ou inválido.';
    return `Gemini retornou erro HTTP ${status}.${bodyText ? ' Detalhe: ' + bodyText.substring(0, 160) : ''}`;
  }

  async function generateStages(settings) {
    const prompt = buildPrompt(settings);
    let response;

    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CF.CONFIG.geminiModel}:generateContent?key=${encodeURIComponent(settings.apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
    } catch (networkError) {
      throw new Error('Não foi possível conectar ao Gemini. Verifique internet, bloqueio do navegador ou CORS.');
    }

    if (!response.ok) {
      let bodyText = '';
      try { bodyText = await response.text(); } catch (ignore) {}
      throw new Error(friendlyGeminiError(response.status, bodyText));
    }

    const data = await response.json();
    const text = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]
      ? data.candidates[0].content.parts[0].text
      : '';

    const parsed = JSON.parse(Utils.cleanJSON(text));
    if (!Array.isArray(parsed) || !parsed.length) {
      throw new Error('A IA retornou JSON vazio.');
    }

    const count = Number(settings.questionCount || parsed.length);
    const stages = [];
    for (let index = 0; index < count; index += 1) {
      stages.push(normalizeStage(parsed[index] || parsed[index % parsed.length], index));
    }
    return stages;
  }

  CF.Gemini = {
    generateStages: generateStages,
    friendlyGeminiError: friendlyGeminiError
  };
}());
