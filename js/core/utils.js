(function () {
  window.CF = window.CF || {};

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[char];
    });
  }

  function normalizeText(value) {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function pick(array) {
    if (!array || !array.length) return null;
    return array[Math.floor(Math.random() * array.length)];
  }

  function sample(array, count) {
    const copy = (array || []).slice();
    const result = [];
    while (copy.length && result.length < count) {
      const index = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(index, 1)[0]);
    }
    return result;
  }

  function weightedPick(weights) {
    const entries = Object.entries(weights || {}).filter(function (entry) { return Number(entry[1]) > 0; });
    const total = entries.reduce(function (sum, entry) { return sum + Number(entry[1]); }, 0);
    if (!total) return entries[0] ? entries[0][0] : 'standard';
    let roll = Math.random() * total;
    for (const entry of entries) {
      roll -= Number(entry[1]);
      if (roll <= 0) return entry[0];
    }
    return entries[entries.length - 1][0];
  }

  function toPercent(correct, total) {
    if (!total) return '0%';
    return `${Math.round((correct / total) * 100)}%`;
  }

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function cleanJSON(text) {
    const value = String(text || '');
    const firstBracket = value.indexOf('[');
    const lastBracket = value.lastIndexOf(']');
    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error('A IA não retornou uma lista JSON válida.');
    }
    return value.substring(firstBracket, lastBracket + 1);
  }

  function correctIndexFromValue(value, options) {
    const safeOptions = Array.isArray(options) ? options : [];
    if (typeof value === 'number') return clamp(value, 0, Math.max(safeOptions.length - 1, 0));
    const text = String(value ?? '').trim();
    const letterMap = { A: 0, B: 1, C: 2, D: 3 };
    const first = text.charAt(0).toUpperCase();
    if (Object.prototype.hasOwnProperty.call(letterMap, first)) return letterMap[first];
    const normalized = normalizeText(text);
    const found = safeOptions.findIndex(function (opt) {
      return normalizeText(opt) === normalized;
    });
    return found >= 0 ? found : 0;
  }

  function shuffle(array) {
    const copy = (array || []).slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function letter(index) {
    return ['A', 'B', 'C', 'D', 'E'][index] || String(index + 1);
  }

  function uid(prefix) {
    return `${prefix || 'id'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  CF.Utils = {
    clamp: clamp,
    escapeHTML: escapeHTML,
    normalizeText: normalizeText,
    pick: pick,
    sample: sample,
    weightedPick: weightedPick,
    toPercent: toPercent,
    safeJsonParse: safeJsonParse,
    cleanJSON: cleanJSON,
    correctIndexFromValue: correctIndexFromValue,
    shuffle: shuffle,
    letter: letter,
    uid: uid
  };
}());
