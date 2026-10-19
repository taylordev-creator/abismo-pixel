(function (global) {
  'use strict';

  var RARIDADES = {
    comum: { nome: 'Comum', cor: '#b8b8b8', multiplicador: 1 },
    incomum: { nome: 'Incomum', cor: '#5fd35f', multiplicador: 1.25 },
    raro: { nome: 'Raro', cor: '#4a9eff', multiplicador: 1.6 },
    epico: { nome: 'Épico', cor: '#b05cff', multiplicador: 2.1 },
    lendario: { nome: 'Lendário', cor: '#ffb020', multiplicador: 2.8 }
  };

  var TIPOS_ARMA = {
    espada: { alcance: 18, arco: 90, cooldown: 400 },
    machado: { alcance: 16, arco: 120, cooldown: 600 },
    lanca: { alcance: 28, arco: 30, cooldown: 500 },
    adaga: { alcance: 12, arco: 60, cooldown: 220 },
    cajado: { alcance: 22, arco: 45, cooldown: 550 },
    arco: { alcance: 160, arco: 10, cooldown: 700 }
  };

  var SLOTS_ARMADURA = ['capacete', 'peitoral', 'botas'];

  function arma(id, nome, tipo, raridade, stats, visual) {
    var base = TIPOS_ARMA[tipo];
    return {
      id: id,
      nome: nome,
      categoria: 'arma',
      slot: 'arma',
      tipo: tipo,
      raridade: raridade,
      dano: stats.dano,
      defesa: stats.defesa || 0,
      modificador_vida: stats.modificador_vida || 0,
      velocidade: stats.velocidade || 0,
      preco: stats.preco,
      alcance: base.alcance,
      arco: base.arco,
      cooldown: base.cooldown,
      visual: visual
    };
  }

  function armadura(id, nome, slot, raridade, stats, visual) {
    return {
      id: id,
      nome: nome,
      categoria: 'armadura',
      slot: slot,
      raridade: raridade,
      dano: stats.dano || 0,
      defesa: stats.defesa,
      modificador_vida: stats.modificador_vida || 0,
      velocidade: stats.velocidade || 0,
      preco: stats.preco,
      visual: visual
    };
  }

  var SPRITES_ARMA = {
    espada: [
      '..0..',
      '..1..',
      '..1..',
      '..1..',
      '.222.',
      '..3..'
    ],
    machado: [
      '.110.',
      '1111.',
      '.13..',
      '..3..',
      '..3..',
      '..3..'
    ],
    lanca: [
      '..1..',
      '.111.',
      '..3..',
      '..3..',
      '..3..',
      '..3..'
    ],
    adaga: [
      '..1..',
      '..1..',
      '.222.',
      '..3..'
    ],
    cajado: [
      '.444.',
      '.414.',
      '.444.',
      '..3..',
      '..3..',
      '..3..'
    ],
    arco: [
      '.31..',
      '3.1..',
      '3..1.',
      '3..1.',
      '3.1..',
      '.31..'
    ]
  };

  var SPRITES_ARMADURA = {
    capacete: [
      '.111.',
      '11111',
      '12221',
      '1...1'
    ],
    peitoral: [
      '1.1.1',
      '11111',
      '12221',
      '12321',
      '11111'
    ],
    botas: [
      '11.11',
      '11.11',
      '111.111'.slice(0, 5)
    ]
  };

  function visualArma(tipo, lamina, cabo, guarda, brilho, extra) {
    var v = {
      sprite: SPRITES_ARMA[tipo],
      paleta: { '0': lamina, '1': lamina, '2': guarda, '3': cabo, '4': brilho || lamina },
      cor_principal: lamina,
      cor_secundaria: cabo,
      cor_brilho: brilho || lamina,
      rastro: lamina,
      escala: 1
    };
    if (extra) {
      for (var k in extra) v[k] = extra[k];
    }
    return v;
  }

  function visualArmadura(slot, principal, secundaria, detalhe, extra) {
    var v = {
      sprite: SPRITES_ARMADURA[slot],
      paleta: { '1': principal, '2': secundaria, '3': detalhe },
      cor_principal: principal,
      cor_secundaria: secundaria,
      cor_detalhe: detalhe
    };
    if (extra) {
      for (var k in extra) v[k] = extra[k];
    }
    return v;
  }

  var armas = {
    espada_enferrujada: arma('espada_enferrujada', 'Espada Enferrujada', 'espada', 'comum',
      { dano: 4, velocidade: 0, preco: 15 },
      visualArma('espada', '#8a6a4f', '#4a3224', '#6b5a4a')),
    espada_ferro: arma('espada_ferro', 'Espada de Ferro', 'espada', 'incomum',
      { dano: 7, velocidade: 0, preco: 60 },
      visualArma('espada', '#c9d1d9', '#5c3d22', '#8a8f98')),
    espada_aco: arma('espada_aco', 'Espada de Aço', 'espada', 'raro',
      { dano: 11, velocidade: 0.05, preco: 180 },
      visualArma('espada', '#e6f0ff', '#2b3a55', '#7fb2ff', '#ffffff')),
    espada_chama: arma('espada_chama', 'Lâmina Flamejante', 'espada', 'epico',
      { dano: 16, velocidade: 0.1, preco: 520 },
      visualArma('espada', '#ff7a1a', '#5a1a0a', '#ffd23f', '#ffe27a', { rastro: '#ff4a00', particulas: '#ff9a3a' })),
    espada_vazio: arma('espada_vazio', 'Lâmina do Vazio', 'espada', 'lendario',
      { dano: 24, velocidade: 0.15, modificador_vida: 10, preco: 1400 },
      visualArma('espada', '#7a2cff', '#1a0a33', '#e0b3ff', '#ffffff', { rastro: '#b05cff', particulas: '#d9a6ff' })),

    machado_lenhador: arma('machado_lenhador', 'Machado de Lenhador', 'machado', 'comum',
      { dano: 6, velocidade: -0.1, preco: 25 },
      visualArma('machado', '#9aa0a6', '#6b4423', '#6b4423')),
    machado_guerra: arma('machado_guerra', 'Machado de Guerra', 'machado', 'raro',
      { dano: 14, velocidade: -0.15, modificador_vida: 5, preco: 240 },
      visualArma('machado', '#d4d9de', '#3b2a1a', '#a33a3a', '#ffffff', { rastro: '#d4d9de' })),
    machado_gelo: arma('machado_gelo', 'Machado Glacial', 'machado', 'epico',
      { dano: 19, velocidade: -0.1, preco: 580 },
      visualArma('machado', '#8fe3ff', '#23405a', '#d6f6ff', '#ffffff', { rastro: '#8fe3ff', particulas: '#d6f6ff' })),

    lanca_madeira: arma('lanca_madeira', 'Lança de Madeira', 'lanca', 'comum',
      { dano: 5, velocidade: 0, preco: 20 },
      visualArma('lanca', '#b0b0b0', '#8a5a2b', '#8a5a2b')),
    lanca_cavaleiro: arma('lanca_cavaleiro', 'Lança do Cavaleiro', 'lanca', 'incomum',
      { dano: 9, velocidade: 0.05, preco: 90 },
      visualArma('lanca', '#e0e6ec', '#4a2f1a', '#c93a3a')),
    lanca_trovao: arma('lanca_trovao', 'Lança do Trovão', 'lanca', 'lendario',
      { dano: 22, velocidade: 0.12, preco: 1250 },
      visualArma('lanca', '#fff35c', '#2a2a55', '#6ad1ff', '#ffffff', { rastro: '#fff35c', particulas: '#6ad1ff' })),

    adaga_cacador: arma('adaga_cacador', 'Adaga de Caçador', 'adaga', 'comum',
      { dano: 3, velocidade: 0.15, preco: 18 },
      visualArma('adaga', '#b8c0c8', '#3a2a1a', '#5a4a3a')),
    adaga_sombra: arma('adaga_sombra', 'Adaga das Sombras', 'adaga', 'raro',
      { dano: 8, velocidade: 0.3, preco: 210 },
      visualArma('adaga', '#3a2a5a', '#120a1f', '#8a5cff', '#c9a6ff', { rastro: '#5a3a8a' })),
    adaga_veneno: arma('adaga_veneno', 'Presa Venenosa', 'adaga', 'epico',
      { dano: 11, velocidade: 0.35, preco: 540 },
      visualArma('adaga', '#6bff4a', '#1a3a12', '#2a7a1a', '#d2ffbf', { rastro: '#6bff4a', particulas: '#a6ff8a' })),

    cajado_aprendiz: arma('cajado_aprendiz', 'Cajado de Aprendiz', 'cajado', 'comum',
      { dano: 4, modificador_vida: 5, velocidade: 0, preco: 30 },
      visualArma('cajado', '#6ab0ff', '#6b4423', '#6b4423', '#aad4ff')),
    cajado_arcano: arma('cajado_arcano', 'Cajado Arcano', 'cajado', 'epico',
      { dano: 13, modificador_vida: 15, velocidade: 0.05, preco: 600 },
      visualArma('cajado', '#d06bff', '#2a1a4a', '#2a1a4a', '#f0c9ff', { rastro: '#d06bff', particulas: '#f0c9ff' })),

    arco_curto: arma('arco_curto', 'Arco Curto', 'arco', 'comum',
      { dano: 5, velocidade: 0.05, preco: 28 },
      visualArma('arco', '#e8d9a8', '#7a5230', '#7a5230', '#ffffff', { projetil: '#d9c38a' })),
    arco_elfico: arma('arco_elfico', 'Arco Élfico', 'arco', 'raro',
      { dano: 10, velocidade: 0.15, preco: 230 },
      visualArma('arco', '#9aff9a', '#2f6b3a', '#2f6b3a', '#e6ffe6', { projetil: '#9aff9a' })),
    arco_celeste: arma('arco_celeste', 'Arco Celeste', 'arco', 'lendario',
      { dano: 20, velocidade: 0.25, modificador_vida: 8, preco: 1300 },
      visualArma('arco', '#ffe27a', '#fff6d6', '#ffb020', '#ffffff', { projetil: '#ffe27a', particulas: '#fff6d6' }))
  };

  var armaduras = {
    capacete_couro: armadura('capacete_couro', 'Capuz de Couro', 'capacete', 'comum',
      { defesa: 1, preco: 12 },
      visualArmadura('capacete', '#8a5a2b', '#5a3a1a', '#3a2410')),
    capacete_ferro: armadura('capacete_ferro', 'Elmo de Ferro', 'capacete', 'incomum',
      { defesa: 3, velocidade: -0.02, preco: 55 },
      visualArmadura('capacete', '#aab2bb', '#6b737c', '#2a2f35')),
    capacete_aco: armadura('capacete_aco', 'Elmo de Aço', 'capacete', 'raro',
      { defesa: 5, modificador_vida: 5, velocidade: -0.02, preco: 170 },
      visualArmadura('capacete', '#dfe8f2', '#8fa3ba', '#c93a3a', { crista: '#c93a3a' })),
    capacete_dragao: armadura('capacete_dragao', 'Elmo de Dragão', 'capacete', 'lendario',
      { defesa: 9, modificador_vida: 20, preco: 1100 },
      visualArmadura('capacete', '#b01e1e', '#5a0a0a', '#ffd23f', { chifres: '#ffd23f', brilho: '#ff4a00' })),

    peitoral_tecido: armadura('peitoral_tecido', 'Túnica de Tecido', 'peitoral', 'comum',
      { defesa: 1, modificador_vida: 5, velocidade: 0.02, preco: 14 },
      visualArmadura('peitoral', '#c9b38a', '#8a7a5a', '#5a4a3a')),
    peitoral_couro: armadura('peitoral_couro', 'Gibão de Couro', 'peitoral', 'comum',
      { defesa: 3, modificador_vida: 10, preco: 35 },
      visualArmadura('peitoral', '#8a5a2b', '#5a3a1a', '#d9a441')),
    peitoral_malha: armadura('peitoral_malha', 'Cota de Malha', 'peitoral', 'incomum',
      { defesa: 6, modificador_vida: 15, velocidade: -0.04, preco: 120 },
      visualArmadura('peitoral', '#9aa3ad', '#69727c', '#3a4048')),
    peitoral_placas: armadura('peitoral_placas', 'Armadura de Placas', 'peitoral', 'raro',
      { defesa: 11, modificador_vida: 25, velocidade: -0.08, preco: 320 },
      visualArmadura('peitoral', '#dfe8f2', '#8fa3ba', '#4a9eff')),
    peitoral_sombrio: armadura('peitoral_sombrio', 'Manto Sombrio', 'peitoral', 'epico',
      { defesa: 8, modificador_vida: 20, velocidade: 0.1, preco: 640 },
      visualArmadura('peitoral', '#2a1a4a', '#120a1f', '#b05cff', { aura: '#b05cff' })),
    peitoral_dragao: armadura('peitoral_dragao', 'Couraça de Dragão', 'peitoral', 'lendario',
      { defesa: 16, modificador_vida: 45, velocidade: -0.03, preco: 1500 },
      visualArmadura('peitoral', '#b01e1e', '#5a0a0a', '#ffd23f', { aura: '#ff4a00' })),

    botas_pano: armadura('botas_pano', 'Sandálias de Pano', 'botas', 'comum',
      { defesa: 0, velocidade: 0.05, preco: 10 },
      visualArmadura('botas', '#c9b38a', '#8a7a5a', '#5a4a3a')),
    botas_couro: armadura('botas_couro', 'Botas de Couro', 'botas', 'incomum',
      { defesa: 2, velocidade: 0.08, preco: 45 },
      visualArmadura('botas', '#8a5a2b', '#5a3a1a', '#3a2410')),
    botas_ferro: armadura('botas_ferro', 'Botas de Ferro', 'botas', 'raro',
      { defesa: 4, velocidade: -0.03, preco: 140 },
      visualArmadura('botas', '#aab2bb', '#6b737c', '#2a2f35')),
    botas_vento: armadura('botas_vento', 'Botas do Vento', 'botas', 'epico',
      { defesa: 3, velocidade: 0.25, preco: 480 },
      visualArmadura('botas', '#9ff0ff', '#4aa8c9', '#ffffff', { rastro: '#9ff0ff' }))
  };

  var itens = {};
  var k;
  for (k in armas) itens[k] = armas[k];
  for (k in armaduras) itens[k] = armaduras[k];

  var PADRAO = {
    arma: 'espada_enferrujada',
    capacete: null,
    peitoral: 'peitoral_tecido',
    botas: 'botas_pano'
  };

  var APARENCIA_BASE = {
    pele: '#f2c9a0',
    cabelo: '#4a2f1a',
    olhos: '#1a1a1a',
    roupa: '#3a6bc9',
    roupa_sombra: '#264a8a'
  };

  function obter(id) {
    return itens[id] || null;
  }

  function listarPorCategoria(categoria) {
    var r = [];
    for (var id in itens) {
      if (itens[id].categoria === categoria) r.push(itens[id]);
    }
    return r;
  }

  function listarPorSlot(slot) {
    var r = [];
    for (var id in itens) {
      if (itens[id].slot === slot) r.push(itens[id]);
    }
    return r;
  }

  function listarPorRaridade(raridade) {
    var r = [];
    for (var id in itens) {
      if (itens[id].raridade === raridade) r.push(itens[id]);
    }
    return r;
  }

  function criarEquipamento(inicial) {
    var eq = { arma: null, capacete: null, peitoral: null, botas: null };
    var base = inicial || PADRAO;
    for (var s in eq) {
      if (base[s]) eq[s] = base[s];
    }
    return eq;
  }

  function equipar(equipamento, id) {
    var item = obter(id);
    if (!item) return null;
    var anterior = equipamento[item.slot] || null;
    equipamento[item.slot] = id;
    return anterior;
  }

  function desequipar(equipamento, slot) {
    var anterior = equipamento[slot] || null;
    equipamento[slot] = null;
    return anterior;
  }

  function calcularStats(equipamento, base) {
    var b = base || {};
    var stats = {
      dano: b.dano || 1,
      defesa: b.defesa || 0,
      vida_maxima: b.vida_maxima || 100,
      velocidade: b.velocidade || 1,
      alcance: 14,
      arco: 60,
      cooldown: 500
    };
    var bonusVelocidade = 0;
    var bonusVida = 0;
    for (var slot in equipamento) {
      var item = obter(equipamento[slot]);
      if (!item) continue;
      stats.dano += item.dano;
      stats.defesa += item.defesa;
      bonusVida += item.modificador_vida;
      bonusVelocidade += item.velocidade;
      if (item.categoria === 'arma') {
        stats.alcance = item.alcance;
        stats.arco = item.arco;
        stats.cooldown = item.cooldown;
      }
    }
    stats.vida_maxima += bonusVida;
    stats.velocidade = Math.max(0.3, stats.velocidade + bonusVelocidade);
    stats.cooldown = Math.max(80, Math.round(stats.cooldown / (1 + Math.max(0, bonusVelocidade))));
    return stats;
  }

  function calcularReducaoDano(defesa) {
    return defesa / (defesa + 40);
  }

  function calcularDanoRecebido(danoBruto, defesa) {
    return Math.max(1, Math.round(danoBruto * (1 - calcularReducaoDano(defesa))));
  }

  function calcularAparencia(equipamento, aparenciaBase) {
    var base = aparenciaBase || APARENCIA_BASE;
    var ap = {
      pele: base.pele,
      cabelo: base.cabelo,
      olhos: base.olhos,
      roupa: base.roupa,
      roupa_sombra: base.roupa_sombra,
      capacete: null,
      peitoral: null,
      botas: null,
      arma: null,
      aura: null,
      rastro: null
    };
    var cap = obter(equipamento.capacete);
    var pei = obter(equipamento.peitoral);
    var bot = obter(equipamento.botas);
    var arm = obter(equipamento.arma);
    if (cap) ap.capacete = cap.visual;
    if (pei) {
      ap.peitoral = pei.visual;
      ap.roupa = pei.visual.cor_principal;
      ap.roupa_sombra = pei.visual.cor_secundaria;
      if (pei.visual.aura) ap.aura = pei.visual.aura;
    }
    if (bot) {
      ap.botas = bot.visual;
      if (bot.visual.rastro) ap.rastro = bot.visual.rastro;
    }
    if (arm) {
      ap.arma = arm.visual;
      if (!ap.rastro && arm.visual.rastro) ap.rastro = arm.visual.rastro;
    }
    return ap;
  }

  function desenharSprite(ctx, sprite, paleta, x, y, tamanhoPixel, espelhar) {
    var altura = sprite.length;
    for (var j = 0; j < altura; j++) {
      var linha = sprite[j];
      var largura = linha.length;
      for (var i = 0; i < largura; i++) {
        var c = linha.charAt(i);
        if (c === '.' || c === ' ') continue;
        var cor = paleta[c];
        if (!cor) continue;
        ctx.fillStyle = cor;
        var px = espelhar ? x + (largura - 1 - i) * tamanhoPixel : x + i * tamanhoPixel;
        ctx.fillRect(Math.round(px), Math.round(y + j * tamanhoPixel), tamanhoPixel, tamanhoPixel);
      }
    }
  }

  function desenharPersonagem(ctx, x, y, equipamento, opcoes) {
    var o = opcoes || {};
    var p = o.pixel || 3;
    var dir = o.direcao === -1 ? -1 : 1;
    var espelhar = dir === -1;
    var ap = o.aparencia || calcularAparencia(equipamento, o.aparenciaBase);
    var anim = o.passo ? (o.passo % 2) : 0;

    ctx.save();

    if (ap.aura) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = ap.aura;
      ctx.fillRect(x - p, y - p, p * 9, p * 17);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x, y + p * 15, p * 7, p);

    ctx.fillStyle = ap.roupa_sombra;
    ctx.fillRect(x + p, y + p * 10, p, p * 4);
    ctx.fillRect(x + p * 5, y + p * 10, p, p * 4);

    var corBota = ap.botas ? ap.botas.cor_principal : ap.pele;
    var corBotaSombra = ap.botas ? ap.botas.cor_secundaria : ap.pele;
    ctx.fillStyle = corBota;
    ctx.fillRect(x + p, y + p * 13 + (anim ? 0 : -0), p * 2, p * 2);
    ctx.fillRect(x + p * 4, y + p * 13 + (anim ? -p : 0) + (anim ? p : 0), p * 2, p * 2);
    ctx.fillStyle = corBotaSombra;
    ctx.fillRect(x + p, y + p * 14, p * 2, p);
    ctx.fillRect(x + p * 4, y + p * 14, p * 2, p);

    ctx.fillStyle = ap.roupa;
    ctx.fillRect(x + p, y + p * 6, p * 5, p * 5);
    ctx.fillStyle = ap.roupa_sombra;
    ctx.fillRect(x + p, y + p * 9, p * 5, p);
    ctx.fillRect(x + p * 3, y + p * 6, p, p * 4);

    if (ap.peitoral) {
      desenharSprite(ctx, ap.peitoral.sprite, ap.peitoral.paleta, x + p, y + p * 6, p, espelhar);
    }

    ctx.fillStyle = ap.pele;
    ctx.fillRect(x, y + p * 7, p, p * 3);
    ctx.fillRect(x + p * 6, y + p * 7, p, p * 3);

    ctx.fillStyle = ap.pele;
    ctx.fillRect(x + p, y + p * 2, p * 5, p * 4);
    ctx.fillStyle = ap.cabelo;
    ctx.fillRect(x + p, y + p, p * 5, p * 2);
    ctx.fillRect(x + p, y + p * 3, p, p * 2);
    ctx.fillStyle = ap.olhos;
    var ox = espelhar ? 2 : 4;
    ctx.fillRect(x + p * ox, y + p * 4, p, p);

    if (ap.capacete) {
      desenharSprite(ctx, ap.capacete.sprite, ap.capacete.paleta, x + p, y + p, p, espelhar);
      if (ap.capacete.crista) {
        ctx.fillStyle = ap.capacete.crista;
        ctx.fillRect(x + p * 3, y - p, p, p * 2);
      }
      if (ap.capacete.chifres) {
        ctx.fillStyle = ap.capacete.chifres;
        ctx.fillRect(x, y, p, p * 2);
        ctx.fillRect(x + p * 6, y, p, p * 2);
      }
    }

    if (ap.arma) {
      var ax = espelhar ? x - p * 4 : x + p * 6;
      var ay = y + p * 3;
      desenharSprite(ctx, ap.arma.sprite, ap.arma.paleta, ax, ay, p, espelhar);
      if (ap.arma.particulas && o.tempo !== undefined) {
        var t = o.tempo / 200;
        ctx.fillStyle = ap.arma.particulas;
        ctx.fillRect(Math.round(ax + Math.sin(t) * p * 2 + p * 2), Math.round(ay - p + Math.cos(t * 1.3) * p), p, p);
      }
    }

    ctx.restore();
  }

  function desenharIcone(ctx, id, x, y, tamanhoPixel) {
    var item = obter(id);
    if (!item) return;
    var p = tamanhoPixel || 4;
    var v = item.visual;
    ctx.fillStyle = RARIDADES[item.raridade].cor;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(x, y, p * 8, p * 8);
    ctx.globalAlpha = 1;
    desenharSprite(ctx, v.sprite, v.paleta, x + p, y + p, p, false);
  }

  global.GameItems = {
    RARIDADES: RARIDADES,
    TIPOS_ARMA: TIPOS_ARMA,
    SLOTS_ARMADURA: SLOTS_ARMADURA,
    SLOTS: ['arma', 'capacete', 'peitoral', 'botas'],
    PADRAO: PADRAO,
    APARENCIA_BASE: APARENCIA_BASE,
    armas: armas,
    armaduras: armaduras,
    itens: itens,
    obter: obter,
    listarPorCategoria: listarPorCategoria,
    listarPorSlot: listarPorSlot,
    listarPorRaridade: listarPorRaridade,
    criarEquipamento: criarEquipamento,
    equipar: equipar,
    desequipar: desequipar,
    calcularStats: calcularStats,
    calcularReducaoDano: calcularReducaoDano,
    calcularDanoRecebido: calcularDanoRecebido,
    calcularAparencia: calcularAparencia,
    desenharSprite: desenharSprite,
    desenharPersonagem: desenharPersonagem,
    desenharIcone: desenharIcone
  };
})(window);
