(function () {
  window.CF = window.CF || {};

  function getSettings(useAI) {
    const subject = document.getElementById('subject').value;
    const theme = document.getElementById('rpg-theme').value;
    const content = document.getElementById('class-content').value.trim();
    const apiKey = document.getElementById('api-key').value.trim();
    const questionCount = Number(document.getElementById('difficulty').value || 9);

    if (!subject && content.length < 10) {
      throw new Error('No modo livre, coloque um PDF/TXT ou cole um texto de pelo menos 10 caracteres.');
    }
    if (useAI && !apiKey) {
      throw new Error('Falta a API Key do Gemini para gerar com IA.');
    }

    return {
      subject: subject || 'Modo livre',
      theme: theme,
      content: content,
      apiKey: apiKey,
      questionCount: questionCount,
      source: useAI ? 'gemini' : 'demo'
    };
  }

  async function startRun(useAI) {
    try {
      CF.Screens.showLoading(true);
      const settings = getSettings(useAI);
      const stages = useAI
        ? await CF.Gemini.generateStages(settings)
        : CF.Dungeon.getDemoStages(settings.questionCount);

      CF.Dungeon.createRun(stages, settings);
      CF.Screens.showLoading(false);
      CF.Screens.showGame();
      CF.Map.render();
    } catch (error) {
      CF.Screens.showLoading(false);
      alert(`Erro: ${error.message}`);
    }
  }

  async function handleFileInput(event) {
    const file = event.target.files[0];
    if (!file) return;
    const textarea = document.getElementById('class-content');
    try {
      textarea.value = '⏳ Lendo arquivo...';
      textarea.value = await CF.PdfReader.readUploadedFile(file);
    } catch (error) {
      textarea.value = '';
      alert(`Erro ao ler arquivo: ${error.message}`);
    }
  }

  function bindActions() {
    document.body.addEventListener('click', function (event) {
      const actionElement = event.target.closest('[data-action]');
      if (!actionElement) return;
      const action = actionElement.dataset.action;
      CF.Audio.playSound('click');

      if (action === 'start-ai') startRun(true);
      if (action === 'start-demo') startRun(false);
      if (action === 'dashboard') CF.Screens.showDashboard();
      if (action === 'close-dashboard') CF.Screens.hideDashboard();
      if (action === 'close-modal') CF.Modal.close();
      if (action === 'export-pdf') CF.PdfExporter.exportPDF();
      if (action === 'restart') CF.Screens.restart();
    });

    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', handleFileInput);

    const gameArea = document.getElementById('game-area');
    gameArea.addEventListener('wheel', function (event) {
      if (window.innerWidth > 768) {
        event.preventDefault();
        gameArea.scrollLeft += event.deltaY;
      }
    }, { passive: false });
  }

  function tryLoadSave() {
    const saved = CF.State.loadRun();
    if (!saved) return false;
    const shouldContinue = confirm('💾 Existe uma run em andamento. Deseja continuar?');
    if (!shouldContinue) {
      CF.State.resetRun();
      return false;
    }
    CF.Screens.showGame();
    CF.Map.render();
    return true;
  }

  function init() {
    CF.Confetti.init();
    bindActions();
    if (!tryLoadSave()) CF.Screens.showConfig();
  }

  window.addEventListener('DOMContentLoaded', init);
}());
