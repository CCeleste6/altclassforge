(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;

  function buildPrompt(settings) {
    const safeContent = String(settings.content || '').trim();
    const contentLimit = settings.subject && settings.subject !== 'Modo livre' ? 2200 : 3200;
    const clippedContent = safeContent.substring(0, contentLimit);

    const sourceInstruction = settings.subject && settings.subject !== 'Modo livre'
      ? `Matéria principal: ${settings.subject}. Texto de apoio opcional: "${clippedContent}".`
      : `Baseie-se ESTRITAMENTE neste texto: "${clippedContent}".`;

    const classInstruction = settings.emblemEquipped
      ? 'Classe equipada: EMBLEMA DO GRÃO-MESTRE. Evite Questões Padrão. Dê preferência a Questões Múltiplas, Científicas e Rápidas.'
      : `Classe escolhida: ${settings.classId}. Guerreiro = equilibrado; Arqueiro = mais foco em Questões Múltiplas; Ladino = mais Questões Rápidas; Mago = mais Questões Científicas.`;

    return `ATUE COMO DESIGNER DE RPG EDUCACIONAL E PROFESSOR.
${sourceInstruction}
${classInstruction}

OBJETIVO: gere APENAS JSON válido com EXATAMENTE ${settings.questionCount} objetos. Cada objeto será uma casa de questão de uma dungeon roguelike educacional.

TIPOS DE QUESTÃO OBRIGATÓRIOS EM CADA OBJETO:
1. standard = Questão Padrão com 4 alternativas.
2. multiple = Questão Múltipla com afirmações para marcar como Verdadeiras ou Falsas.
3. scientific = Questão Científica com enunciado elaborado e informações vitais.
4. quick = Questão Rápida simples, com tempo sugerido.

REGRAS IMPORTANTES:
- Não use markdown.
- Não envolva a resposta em crases.
- A resposta deve começar com [ e terminar com ].
- title: nome curto e criativo de inimigo, guardião, armadilha ou boss.
- desc: lore curta misturando RPG e conteúdo escolar.
- correct deve ser número de 0 a 3.
- options sempre deve ter exatamente 4 alternativas.
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

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function uniqueList(items) {
    const seen = {};
    return (items || []).filter(function (item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function parseErrorMessage(bodyText) {
    if (!bodyText) return '';
    try {
      const parsed = JSON.parse(bodyText);
      return parsed && parsed.error && parsed.error.message ? parsed.error.message : bodyText;
    } catch (ignore) {
      return bodyText;
    }
  }

  function friendlyGeminiError(status, bodyText, modelId) {
    const detail = parseErrorMessage(bodyText);
    const modelSuffix = modelId ? ` Modelo: ${modelId}.` : '';

    if (status === 503) return `Gemini retornou HTTP 503.${modelSuffix} O serviço está temporariamente sem capacidade/sobrecarregado.`;
    if (status === 504) return `Gemini demorou demais para responder.${modelSuffix} Tente de novo ou use um modelo mais leve.`;
    if (status === 500) return `Gemini retornou HTTP 500.${modelSuffix} Erro temporário do lado do serviço.`;
    if (status === 429) return `Gemini retornou HTTP 429.${modelSuffix} Limite de uso atingido ou muitas requisições em pouco tempo.`;
    if (status === 401 || status === 403) return `Gemini recusou a API Key.${modelSuffix} Verifique se a chave está correta, ativa e sem restrição bloqueando este site.`;
    if (status === 400) return `Gemini recusou a requisição.${modelSuffix} O conteúdo pode estar grande demais ou a chave/modelo pode não aceitar essa chamada.${detail ? ' Detalhe: ' + detail.substring(0, 220) : ''}`;
    return `Gemini retornou erro HTTP ${status}.${modelSuffix}${detail ? ' Detalhe: ' + detail.substring(0, 220) : ''}`;
  }

  function shouldRetryStatus(status) {
    return status === 429 || status === 500 || status === 503 || status === 504;
  }

  function buildRequestBody(prompt) {
    return {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        topP: 0.9,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      }
    };
  }

  async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeoutMs || 45000);
    try {
      return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
    } finally {
      clearTimeout(timer);
    }
  }

  function extractText(data) {
    const candidate = data && data.candidates && data.candidates[0];
    const part = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];
    const text = part && typeof part.text === 'string' ? part.text : '';

    if (!text) {
      const finishReason = candidate && candidate.finishReason ? ` Motivo: ${candidate.finishReason}.` : '';
      throw new Error(`Gemini respondeu sem texto aproveitável.${finishReason}`);
    }

    return text;
  }

  function parseStagesFromText(text, count) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (firstError) {
      parsed = JSON.parse(Utils.cleanJSON(text));
    }

    if (!Array.isArray(parsed) || !parsed.length) {
      throw new Error('A IA retornou JSON vazio ou fora do formato esperado.');
    }

    const stages = [];
    for (let index = 0; index < count; index += 1) {
      stages.push(normalizeStage(parsed[index] || parsed[index % parsed.length], index));
    }
    return stages;
  }

  async function requestModel(modelId, prompt, settings, attemptIndex) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(settings.apiKey)}`;
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(prompt))
    }, CF.CONFIG.geminiRequestTimeoutMs);

    if (!response.ok) {
      let bodyText = '';
      try { bodyText = await response.text(); } catch (ignore) {}
      const error = new Error(friendlyGeminiError(response.status, bodyText, modelId));
      error.status = response.status;
      error.modelId = modelId;
      error.attemptIndex = attemptIndex;
      throw error;
    }

    const data = await response.json();
    return extractText(data);
  }

  function getModelPlan(settings) {
    return uniqueList([
      settings.modelId || CF.CONFIG.geminiModel,
      CF.CONFIG.geminiModel,
      ...(CF.CONFIG.geminiFallbackModels || [])
    ]);
  }

  async function generateStages(settings) {
    const prompt = buildPrompt(settings);
    const count = Number(settings.questionCount || 9) || 9;
    const models = getModelPlan(settings);
    const attemptsPerModel = Math.max(1, Number(CF.CONFIG.geminiMaxAttemptsPerModel || 1));
    const errors = [];

    for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
      const modelId = models[modelIndex];

      for (let attempt = 1; attempt <= attemptsPerModel; attempt += 1) {
        try {
          if (CF.Screens && CF.Screens.setLoadingMessage) {
            const extra = attempt > 1 ? ` · tentativa ${attempt}/${attemptsPerModel}` : '';
            CF.Screens.setLoadingMessage(`Chamando Gemini: ${modelId}${extra}...`);
          }

          const text = await requestModel(modelId, prompt, settings, attempt);
          const stages = parseStagesFromText(text, count);
          settings.usedModel = modelId;
          return stages;
        } catch (error) {
          const isAbort = error && error.name === 'AbortError';
          const status = isAbort ? 504 : error.status;
          const normalizedError = isAbort
            ? new Error(friendlyGeminiError(504, '', modelId))
            : error;

          errors.push(normalizedError.message || String(normalizedError));

          const canRetry = isAbort || shouldRetryStatus(status);
          if (!canRetry) {
            throw normalizedError;
          }

          const isLastAttemptForModel = attempt >= attemptsPerModel;
          const isLastModel = modelIndex >= models.length - 1;
          if (isLastAttemptForModel && isLastModel) {
            break;
          }

          const delay = (CF.CONFIG.geminiRetryBaseDelayMs || 900) * attempt * (modelIndex + 1);
          if (CF.Screens && CF.Screens.setLoadingMessage) {
            CF.Screens.setLoadingMessage(`Gemini falhou temporariamente. Tentando novamente em ${(delay / 1000).toFixed(1)}s...`);
          }
          await sleep(delay);
        }
      }
    }

    throw new Error(`Não consegui gerar com IA após testar ${models.length} modelo(s). Último erro: ${errors[errors.length - 1] || 'erro desconhecido'}`);
  }

  CF.Gemini = {
    generateStages: generateStages,
    friendlyGeminiError: friendlyGeminiError
  };
}());
