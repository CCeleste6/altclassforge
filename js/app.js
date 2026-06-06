(function () {
  window.CF = window.CF || {};

  function byId(id) {
    return document.getElementById(id);
  }

  function safeValue(id, fallback) {
    const el = byId(id);
    return el ? el.value : fallback;
  }

  function safeChecked(id) {
    const el = byId(id);
    return el ? Boolean(el.checked) : false;
  }

  function safeClassId(value) {
    const classes = CF.CONFIG.classes || {};
    return classes[value] ? value : 'warrior';
  }

  function safeModelId(value) {
    const models = CF.CONFIG.geminiModels || [];
    const allowed = models.map(function (model) { return model.id; });
    return allowed.indexOf(value) >= 0 ? value : (CF.CONFIG.geminiModel || 'gemini-2.5-flash-lite');
  }


  function selectedClassDesc() {
    const classId = safeClassId(safeValue('class-select', 'warrior'));
    const emblem = safeChecked('grandmaster-emblem');
    const classConfig = emblem && CF.CONFIG.grandmaster ? CF.CONFIG.grandmaster : (CF.CONFIG.classes[classId] || CF.CONFIG.classes.warrior);
    return classConfig.desc || 'Aventura equilibrada.';
  }

  function syncClassDescription() {
    const desc = byId('class-desc');
    if (desc) desc.textContent = selectedClassDesc();
  }

  function getSettings(useAI) {
    const subject = safeValue('subject', '').trim();
    const contentEl = byId('class-content');
    const apiKeyEl = byId('api-key');
    const difficultyEl = byId('difficulty');
    const content = contentEl ? contentEl.value.trim() : '';
    const apiKey = apiKeyEl ? apiKeyEl.value.trim() : '';
    const questionCount = Number(difficultyEl ? difficultyEl.value : 9) || 9;
    const classId = safeClassId(safeValue('class-select', 'warrior'));
    const emblemEquipped = safeChecked('grandmaster-emblem');
    const modelId = safeModelId(safeValue('ai-model', CF.CONFIG.geminiModel));

    if (useAI && !subject && content.length < 10) {
      throw new Error('Para gerar com IA no modo livre, coloque um PDF/TXT ou cole um texto de pelo menos 10 caracteres. O Modo Demo Roguelike funciona sem conteúdo.');
    }
    if (useAI && !apiKey) {
      throw new Error('Falta a API Key do Gemini para gerar com IA. Use o Modo Demo Roguelike para testar sem chave.');
    }

    return {
      subject: subject || (useAI ? 'Modo livre' : 'Demo Roguelike'),
      content: content,
      apiKey: apiKey,
      questionCount: questionCount,
      classId: classId,
      emblemEquipped: emblemEquipped,
      modelId: modelId,
      source: useAI ? 'gemini' : 'demo'
    };
  }

  let isStartingRun = false;

  function startDemoFallback(settings, reason) {
    const fallbackSettings = Object.assign({}, settings || getSettings(false), {
      apiKey: '',
      source: 'demo',
      subject: 'Demo Roguelike'
    });
    const stages = CF.Dungeon.getDemoStages(fallbackSettings.questionCount);
    CF.Dungeon.createRun(stages, fallbackSettings);
    CF.Screens.showLoading(false);
    CF.Screens.showGame();
    CF.Map.render();
    if (reason) {
      console.warn('Class Forge carregou a demo offline:', reason);
    }
  }

  async function startRun(useAI) {
    if (isStartingRun) return;
    isStartingRun = true;

    let settings = null;
    try {
      CF.Screens.showLoading(true, useAI ? 'Preparando chamada ao Gemini...' : 'Carregando Modo Demo Roguelike...');
      settings = getSettings(useAI);

      if (!useAI) {
        startDemoFallback(settings);
        return;
      }

      const stages = await CF.Gemini.generateStages(settings);
      CF.Dungeon.createRun(stages, settings);
      CF.Screens.showLoading(false);
      CF.Screens.showGame();
      CF.Map.render();
    } catch (error) {
      console.error(error);
      CF.Screens.showLoading(false);

      if (useAI && settings) {
        const openDemo = confirm(`Não consegui gerar a dungeon com IA.

${error.message}

Quer abrir o Modo Demo Roguelike mesmo assim?`);
        if (openDemo) startDemoFallback(settings, error.message);
        return;
      }

      alert(`Erro: ${error.message}`);
    } finally {
      isStartingRun = false;
    }
  }

  async function handleFileInput(event) {
    const file = event.target.files[0];
    if (!file) return;
    const textarea = byId('class-content');
    try {
      if (textarea) textarea.value = '⏳ Lendo arquivo...';
      const text = await CF.PdfReader.readUploadedFile(file);
      if (textarea) textarea.value = text;
    } catch (error) {
      if (textarea) textarea.value = '';
      alert(`Erro ao ler arquivo: ${error.message}`);
    }
  }

  function bindActions() {
    document.body.addEventListener('click', function (event) {
      const actionElement = event.target.closest('[data-action]');
      if (!actionElement) return;
      event.preventDefault();
      const action = actionElement.dataset.action;
      CF.Audio.playSound('click');

      if (action === 'start-ai') startRun(true);
      else if (action === 'start-demo') startRun(false);
      else if (action === 'dashboard') CF.Screens.showDashboard();
      else if (action === 'close-dashboard') CF.Screens.hideDashboard();
      else if (action === 'close-modal') CF.Modal.close();
      else if (action === 'export-pdf') CF.PdfExporter.exportPDF();
      else if (action === 'restart') CF.Screens.restart();
    });

    const fileInput = byId('file-input');
    if (fileInput) fileInput.addEventListener('change', handleFileInput);

    const classSelect = byId('class-select');
    const emblem = byId('grandmaster-emblem');
    if (classSelect) classSelect.addEventListener('change', syncClassDescription);
    if (emblem) emblem.addEventListener('change', syncClassDescription);

    const gameArea = byId('game-area');
    if (gameArea) {
      gameArea.addEventListener('wheel', function (event) {
        if (window.innerWidth > 768) {
          event.preventDefault();
          gameArea.scrollLeft += event.deltaY;
        }
      }, { passive: false });
    }
  }

  function tryLoadSave() {
    CF.State.clearLegacySaves && CF.State.clearLegacySaves();
    const saved = CF.State.loadRun();
    if (!saved || !saved.nodes.length) return;
    const shouldContinue = confirm('💾 Existe uma run do Class Forge em andamento. Deseja continuar?');
    if (!shouldContinue) {
      CF.State.resetRun();
      return;
    }
    CF.Screens.showGame();
    CF.Map.render();
  }

  window.CF.App = {
    startRun: startRun,
    startDemoFallback: startDemoFallback
  };

  window.addEventListener('DOMContentLoaded', function () {
    bindActions();
    syncClassDescription();
    tryLoadSave();
  });
}());
