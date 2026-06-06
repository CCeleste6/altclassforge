(function () {
  window.CF = window.CF || {};

  CF.CONFIG = {
    version: '3.0.0-roguelike',
    saveKey: 'classForgeRoguelikeSave',
    maxPdfPages: 6,
    geminiModel: 'gemini-2.5-flash',
    baseWrongDamage: 15,
    baseRewards: {
      battle: 10,
      elite: 16,
      boss: 35
    },
    nodePatterns: {
      small: ['battle', 'treasure', 'battle', 'shop', 'battle', 'boss'],
      medium: ['battle', 'treasure', 'battle', 'camp', 'battle', 'shop', 'battle', 'treasure', 'battle', 'boss'],
      large: ['battle', 'treasure', 'battle', 'camp', 'battle', 'shop', 'battle', 'treasure', 'battle', 'camp', 'battle', 'shop', 'battle', 'treasure', 'battle', 'boss']
    }
  };
}());
