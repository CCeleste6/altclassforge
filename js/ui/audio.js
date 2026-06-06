(function () {
  window.CF = window.CF || {};

  let audioCtx = null;
  let musicInterval = null;

  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playSound(type) {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(760, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        return;
      }

      if (type === 'win') {
        [523.25, 659.25, 783.99].forEach(function (freq, index) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'triangle';
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.1, now + index * 0.08);
          g.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.35);
          o.start(now + index * 0.08);
          o.stop(now + index * 0.08 + 0.35);
        });
        return;
      }

      if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.25);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        return;
      }

      if (type === 'boss') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.9);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
        osc.start(now);
        osc.stop(now + 0.9);
      }
    } catch (_) {
      // Áudio é opcional; alguns navegadores bloqueiam sem interação.
    }
  }

  function playBossMusic() {
    let ctx = null;
    try {
      ctx = getAudioCtx();
    } catch (_) {
      return;
    }
    if (musicInterval) clearInterval(musicInterval);
    let noteIndex = 0;
    const motif = [349.23, 415.3, 466.16, 523.25, 554.37, 523.25, 466.16, 415.3];
    musicInterval = setInterval(function () {
      try {
        const now = ctx.currentTime;
        const freq = motif[noteIndex % motif.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
        osc.start(now);
        osc.stop(now + 0.13);
        noteIndex += 1;
      } catch (_) {
        stopBossMusic();
      }
    }, 150);
  }

  function stopBossMusic() {
    if (musicInterval) clearInterval(musicInterval);
    musicInterval = null;
  }

  CF.Audio = {
    playSound: playSound,
    playBossMusic: playBossMusic,
    stopBossMusic: stopBossMusic
  };
}());
