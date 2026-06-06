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
    return array[Math.floor(Math.random() * array.length)];
  }

  function sample(array, count) {
    const copy = array.slice();
    const result = [];
    while (copy.length && result.length < count) {
      const index = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(index, 1)[0]);
    }
    return result;
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
    const firstBracket = String(text).indexOf('[');
    const lastBracket = String(text).lastIndexOf(']');
    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error('A IA não retornou uma lista JSON válida.');
    }
    return String(text).substring(firstBracket, lastBracket + 1);
  }

  function correctIndexFromValue(value, options) {
    if (typeof value === 'number') return clamp(value, 0, Math.max(options.length - 1, 0));
    const text = String(value ?? '').trim();
    const letterMap = { A: 0, B: 1, C: 2, D: 3 };
    const first = text.charAt(0).toUpperCase();
    if (Object.prototype.hasOwnProperty.call(letterMap, first)) return letterMap[first];
    const normalized = normalizeText(text);
    const found = options.findIndex(function (opt) {
      return normalizeText(opt) === normalized;
    });
    return found >= 0 ? found : 0;
  }

  CF.Utils = {
    clamp: clamp,
    escapeHTML: escapeHTML,
    normalizeText: normalizeText,
    pick: pick,
    sample: sample,
    toPercent: toPercent,
    safeJsonParse: safeJsonParse,
    cleanJSON: cleanJSON,
    correctIndexFromValue: correctIndexFromValue
  };
}());
