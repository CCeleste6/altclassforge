(function () {
  window.CF = window.CF || {};

  const Utils = CF.Utils;

  const POWER_UPS = [
    {
      id: 'coin_bonus',
      icon: '🪙',
      name: 'Bolsa do Mercador',
      desc: '+3 moedas em toda vitória de combate.',
      apply: function () {}
    },
    {
      id: 'max_hp',
      icon: '❤️',
      name: 'Coração de Aço',
      desc: '+10 HP máximo e cura 10 HP.',
      apply: function (run) {
        run.maxHp += 10;
        run.hp = Math.min(run.maxHp, run.hp + 10);
      }
    },
    {
      id: 'focus',
      icon: '🧠',
      name: 'Foco do Sábio',
      desc: 'Reduz o dano por erro em 3. Acumula até dano mínimo 5.',
      apply: function () {}
    },
    {
      id: 'oracle',
      icon: '🎫',
      name: 'Óculos do Oráculo',
      desc: '+1 voucher de dica.',
      apply: function (run) {
        run.vouchers += 1;
      }
    },
    {
      id: 'luck',
      icon: '🍀',
      name: 'Sorte do Ferreiro',
      desc: '+20% moedas recebidas em combate.',
      apply: function () {}
    },
    {
      id: 'shield',
      icon: '🛡️',
      name: 'Escudo de Pergaminho',
      desc: 'Bloqueia o próximo erro sem perder HP.',
      apply: function (run) {
        run.shield += 1;
      }
    },
    {
      id: 'review_key',
      icon: '🗝️',
      name: 'Chave de Revisão',
      desc: 'Respostas abertas exigem 1 palavra-chave a menos.',
      apply: function () {}
    },
    {
      id: 'heal',
      icon: '✨',
      name: 'Fonte Menor',
      desc: 'Cura 25 HP imediatamente.',
      apply: function (run) {
        run.hp = Math.min(run.maxHp, run.hp + 25);
      }
    }
  ];

  function getPowerUps() {
    return POWER_UPS.slice();
  }

  function getPowerUp(id) {
    return POWER_UPS.find(function (power) { return power.id === id; });
  }

  function grantPowerUp(powerId) {
    const power = getPowerUp(powerId);
    if (!power) return;
    CF.State.mutate(function (run) {
      run.powerUps.push({ id: power.id, icon: power.icon, name: power.name, desc: power.desc });
      power.apply(run);
    });
    CF.Screens.syncHUD();
  }

  function getRewardValue(node) {
    const run = CF.State.getRun();
    const base = CF.CONFIG.baseRewards[node.kind] || CF.CONFIG.baseRewards.battle;
    const coinFlat = CF.State.getPowerLevel('coin_bonus') * 3;
    const luckMultiplier = 1 + (CF.State.getPowerLevel('luck') * 0.2);
    return Math.round((base + coinFlat) * luckMultiplier);
  }

  function getWrongDamage() {
    const focus = CF.State.getPowerLevel('focus');
    return Math.max(5, CF.CONFIG.baseWrongDamage - (focus * 3));
  }

  function getStealthRequiredMatches(keywordCount) {
    const base = Math.ceil(keywordCount / 2);
    const reviewKeys = CF.State.getPowerLevel('review_key');
    return Math.max(1, base - reviewKeys);
  }

  function randomChoices(count) {
    return Utils.sample(POWER_UPS, count || 3);
  }

  CF.Loot = {
    getPowerUps: getPowerUps,
    getPowerUp: getPowerUp,
    grantPowerUp: grantPowerUp,
    getRewardValue: getRewardValue,
    getWrongDamage: getWrongDamage,
    getStealthRequiredMatches: getStealthRequiredMatches,
    randomChoices: randomChoices
  };
}());
