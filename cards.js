(function (global) {
  'use strict';

  var GI = global.GameItems || null;
  var GW = global.GameWorld || null;
  var TAU = Math.PI * 2;
  var PRETO = '#0b0a12';

  function rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function limitar(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexParaRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbParaHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      v = Math.max(0, Math.min(255, Math.round(v)));
      return (v < 16 ? '0' : '') + v.toString(16);
    }).join('');
  }

  function misturar(a, b, t) {
    var A = hexParaRgb(a);
    var B = hexParaRgb(b);
    return rgbParaHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }

  function ajustar(hex, f) {
    var A = hexParaRgb(hex);
    return rgbParaHex(A[0] * f, A[1] * f, A[2] * f);
  }

  function rgba(hex, a) {
    var A = hexParaRgb(hex);
    return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')';
  }

  function ret(ctx, cor, x, y, w, h) {
    ctx.fillStyle = cor;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function corRaridade(chave, padrao) {
    if (GI && GI.RARIDADES && GI.RARIDADES[chave]) return GI.RARIDADES[chave].cor;
    return padrao;
  }

  var RAR = {
    comum: { nome: 'COMUM', cor: corRaridade('comum', '#b8b8b8'), escuro: '#4a4a56', fundo: '#1c1c26', arte: '#2a2a38', nivel: 0, peso: 50 },
    incomum: { nome: 'INCOMUM', cor: corRaridade('incomum', '#5fd35f'), escuro: '#24602a', fundo: '#14231a', arte: '#1e3826', nivel: 1, peso: 28 },
    raro: { nome: 'RARO', cor: corRaridade('raro', '#4a9eff'), escuro: '#1c4684', fundo: '#121c36', arte: '#1a3058', nivel: 2, peso: 14 },
    epico: { nome: 'ÉPICO', cor: corRaridade('epico', '#b05cff'), escuro: '#58288a', fundo: '#201236', arte: '#321e58', nivel: 3, peso: 6 },
    lendario: { nome: 'LENDÁRIO', cor: corRaridade('lendario', '#ffb020'), escuro: '#8a5a0a', fundo: '#2a1e0e', arte: '#463112', nivel: 4, peso: 2 }
  };

  var TIPOS = {
    buff: { nome: 'BUFF', cor: '#3fae3f', texto: '#ffffff', peso: 1 },
    maldicao: { nome: 'MALDIÇÃO', cor: '#b8325e', texto: '#ffffff', peso: 0.55 },
    ouro: { nome: 'OURO', cor: '#d9a81e', texto: '#1a1204', peso: 0.8 },
    chave: { nome: 'CHAVE', cor: '#2f9ac9', texto: '#ffffff', peso: 0.35 }
  };

  function novaGrade(n) {
    var g = [];
    for (var y = 0; y < n; y++) {
      g.push([]);
      for (var x = 0; x < n; x++) g[y].push('.');
    }
    return g;
  }

  function pr(g, x, y, w, h, c) {
    for (var j = y; j < y + h; j++) {
      for (var i = x; i < x + w; i++) {
        if (g[j] && g[j][i] !== undefined) g[j][i] = c;
      }
    }
  }

  function pd(g, cx, cy, r, c) {
    for (var y = 0; y < g.length; y++) {
      for (var x = 0; x < g[y].length; x++) {
        var dx = x + 0.5 - cx;
        var dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) g[y][x] = c;
      }
    }
  }

  function pl(g, x0, y0, x1, y1, c) {
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1;
    var sy = y0 < y1 ? 1 : -1;
    var err = dx - dy;
    while (true) {
      if (g[y0] && g[y0][x0] !== undefined) g[y0][x0] = c;
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  function contornar(g, c) {
    var n = g.length;
    var saida = g.map(function (l) { return l.slice(); });
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        if (g[y][x] !== '.') continue;
        var viz = (y > 0 && g[y - 1][x] !== '.') || (y < n - 1 && g[y + 1][x] !== '.') || (x > 0 && g[y][x - 1] !== '.') || (x < n - 1 && g[y][x + 1] !== '.');
        if (viz) saida[y][x] = c;
      }
    }
    return saida;
  }

  var CONSTRUTORES_ICONE = {
    espada: function (g) {
      pr(g, 5, 2, 2, 6, '1');
      pr(g, 5, 2, 1, 6, '3');
      pr(g, 5, 1, 2, 1, '3');
      pr(g, 2, 8, 8, 1, '4');
      pr(g, 5, 9, 2, 1, '2');
      pr(g, 4, 10, 4, 1, '4');
    },
    escudo: function (g) {
      pr(g, 2, 2, 8, 5, '1');
      pr(g, 3, 7, 6, 1, '1');
      pr(g, 4, 8, 4, 1, '1');
      pr(g, 5, 9, 2, 1, '1');
      pr(g, 2, 2, 8, 1, '3');
      pr(g, 2, 3, 1, 4, '3');
      pr(g, 9, 3, 1, 4, '2');
      pr(g, 5, 3, 2, 6, '4');
      pr(g, 3, 4, 6, 2, '4');
    },
    coracao: function (g) {
      pr(g, 2, 2, 3, 1, '1');
      pr(g, 7, 2, 3, 1, '1');
      pr(g, 1, 3, 10, 2, '1');
      pr(g, 2, 5, 8, 1, '1');
      pr(g, 3, 6, 6, 1, '1');
      pr(g, 4, 7, 4, 1, '1');
      pr(g, 5, 8, 2, 1, '1');
      pr(g, 2, 3, 2, 1, '3');
      pr(g, 2, 4, 1, 1, '3');
      pr(g, 9, 4, 1, 1, '2');
      pr(g, 8, 5, 1, 1, '2');
      pr(g, 7, 6, 1, 1, '2');
    },
    bota: function (g) {
      pr(g, 3, 1, 4, 1, '4');
      pr(g, 3, 2, 4, 5, '1');
      pr(g, 3, 7, 7, 2, '1');
      pr(g, 3, 9, 8, 1, '2');
      pr(g, 3, 2, 1, 6, '3');
      pr(g, 8, 7, 2, 2, '4');
    },
    moeda: function (g) {
      pd(g, 6, 6, 4.6, '4');
      pd(g, 6, 6, 3.4, '1');
      pr(g, 5, 3, 2, 6, '3');
      pr(g, 3, 5, 1, 2, '3');
    },
    bolsa: function (g) {
      pd(g, 6, 7.2, 3.9, '1');
      pr(g, 4, 3, 4, 2, '1');
      pr(g, 3, 2, 6, 1, '1');
      pr(g, 4, 4, 4, 1, '4');
      pr(g, 5, 6, 2, 3, '3');
      pr(g, 8, 7, 1, 2, '2');
    },
    chave: function (g) {
      pd(g, 4, 4, 3.2, '1');
      pd(g, 4, 4, 1.2, '.');
      pl(g, 6, 6, 10, 10, '1');
      pl(g, 5, 6, 9, 10, '1');
      pr(g, 9, 7, 1, 2, '1');
      pr(g, 7, 9, 1, 1, '1');
      pr(g, 2, 2, 1, 1, '3');
      pr(g, 3, 1, 2, 1, '3');
    },
    caveira: function (g) {
      pr(g, 2, 2, 8, 6, '1');
      pr(g, 2, 2, 1, 1, '.');
      pr(g, 9, 2, 1, 1, '.');
      pr(g, 3, 8, 6, 2, '1');
      pr(g, 3, 2, 3, 1, '3');
      pr(g, 9, 3, 1, 5, '2');
      pr(g, 3, 4, 2, 2, '5');
      pr(g, 7, 4, 2, 2, '5');
      pr(g, 5, 6, 2, 1, '5');
      pr(g, 4, 9, 1, 1, '5');
      pr(g, 7, 9, 1, 1, '5');
    },
    pocao: function (g) {
      pr(g, 5, 1, 2, 1, '4');
      pr(g, 5, 2, 2, 2, '3');
      pr(g, 4, 4, 4, 1, '1');
      pr(g, 3, 5, 6, 1, '1');
      pr(g, 2, 6, 8, 3, '1');
      pr(g, 3, 9, 6, 1, '1');
      pr(g, 3, 6, 1, 2, '3');
      pr(g, 6, 7, 1, 1, '3');
      pr(g, 8, 8, 1, 1, '2');
    },
    estrela: function (g) {
      pr(g, 5, 1, 2, 2, '1');
      pr(g, 4, 3, 4, 1, '1');
      pr(g, 1, 4, 10, 2, '1');
      pr(g, 2, 6, 8, 1, '1');
      pr(g, 3, 7, 6, 1, '1');
      pr(g, 2, 8, 3, 2, '1');
      pr(g, 7, 8, 3, 2, '1');
      pr(g, 5, 4, 2, 2, '3');
      pr(g, 5, 2, 1, 1, '3');
    },
    chama: function (g) {
      pr(g, 6, 1, 1, 1, '1');
      pr(g, 5, 2, 3, 1, '1');
      pr(g, 4, 3, 4, 1, '1');
      pr(g, 3, 4, 6, 2, '1');
      pr(g, 2, 6, 8, 3, '1');
      pr(g, 3, 9, 6, 1, '1');
      pr(g, 4, 6, 4, 3, '4');
      pr(g, 5, 7, 2, 2, '3');
      pr(g, 7, 3, 1, 1, '1');
    },
    aliado: function (g) {
      pr(g, 4, 1, 4, 1, '2');
      pr(g, 4, 2, 4, 3, '1');
      pr(g, 4, 3, 1, 1, '5');
      pr(g, 7, 3, 1, 1, '5');
      pr(g, 3, 5, 6, 3, '4');
      pr(g, 2, 5, 1, 3, '1');
      pr(g, 9, 5, 1, 3, '1');
      pr(g, 3, 8, 2, 2, '2');
      pr(g, 7, 8, 2, 2, '2');
    },
    ampulheta: function (g) {
      pr(g, 2, 1, 8, 1, '4');
      pr(g, 2, 10, 8, 1, '4');
      pr(g, 3, 2, 6, 1, '3');
      pr(g, 4, 3, 4, 1, '1');
      pr(g, 5, 4, 2, 1, '1');
      pr(g, 5, 5, 2, 1, '3');
      pr(g, 5, 6, 2, 1, '1');
      pr(g, 4, 7, 4, 1, '1');
      pr(g, 3, 8, 6, 2, '1');
    },
    raio: function (g) {
      pr(g, 6, 1, 4, 1, '1');
      pr(g, 5, 2, 4, 1, '1');
      pr(g, 4, 3, 4, 1, '1');
      pr(g, 3, 4, 6, 1, '1');
      pr(g, 5, 5, 4, 1, '1');
      pr(g, 5, 6, 3, 1, '1');
      pr(g, 4, 7, 3, 1, '1');
      pr(g, 4, 8, 2, 1, '1');
      pr(g, 3, 9, 2, 1, '1');
      pr(g, 6, 1, 1, 1, '3');
      pr(g, 5, 2, 1, 1, '3');
      pr(g, 4, 3, 1, 1, '3');
      pr(g, 3, 4, 2, 1, '3');
    }
  };

  var cacheIcones = {};

  function matrizIcone(nome) {
    if (cacheIcones[nome]) return cacheIcones[nome];
    var g = novaGrade(12);
    (CONSTRUTORES_ICONE[nome] || CONSTRUTORES_ICONE.estrela)(g);
    g = contornar(g, '5');
    var linhas = g.map(function (l) { return l.join(''); });
    cacheIcones[nome] = linhas;
    return linhas;
  }

  function paletaIcone(cores) {
    var c1 = (cores && cores['1']) || '#ffffff';
    return {
      '1': c1,
      '2': ajustar(c1, 0.55),
      '3': misturar(c1, '#ffffff', 0.55),
      '4': (cores && cores['4']) || ajustar(c1, 1.25),
      '5': PRETO
    };
  }

  function desenharMatriz(ctx, linhas, paleta, x, y, px) {
    for (var j = 0; j < linhas.length; j++) {
      var l = linhas[j];
      for (var i = 0; i < l.length; i++) {
        var ch = l.charAt(i);
        if (ch === '.') continue;
        var cor = paleta[ch];
        if (!cor) continue;
        ctx.fillStyle = cor;
        ctx.fillRect(Math.round(x + i * px), Math.round(y + j * px), px, px);
      }
    }
  }

  function gerarFundo(seed, w, h, nivel) {
    var rng = mulberry32(seed);
    var linhas = [];
    var cx = w / 2;
    var cy = h / 2;
    for (var y = 0; y < h; y++) {
      var l = '';
      for (var x = 0; x < w; x++) {
        var d = Math.sqrt(Math.pow((x + 0.5 - cx) / (w / 2), 2) + Math.pow((y + 0.5 - cy) / (h / 2), 2));
        var xadrez = (x + y) & 1;
        var ch = '.';
        if (d < 0.6 && xadrez && rng() < 0.55) ch = '3';
        else if (d > 0.8 && !xadrez && rng() < 0.5) ch = '2';
        else if (rng() < 0.02 + 0.012 * nivel) ch = '4';
        l += ch;
      }
      linhas.push(l);
    }
    return linhas;
  }

  var CARTAS = [];

  function nova(o) {
    o.peso = o.peso || 1;
    CARTAS.push(o);
  }

  function nomeMundo(m) {
    return GW && GW.BIOMAS && GW.BIOMAS[m - 1] ? GW.BIOMAS[m - 1].nome : 'Mundo ' + m;
  }

  function corMundo(m) {
    var padrao = { 2: '#8a8aa8', 3: '#6aa84f', 4: '#ff7a1a', 5: '#b05cff' };
    if (GW && GW.BIOMAS && GW.BIOMAS[m - 1]) return GW.BIOMAS[m - 1].detalhe;
    return padrao[m] || '#6ad1ff';
  }

  function escalaOuro(e) {
    return 1 + 0.12 * (Math.max(1, e.nivel) - 1);
  }

  function buff(id, nome, rar, icone, cores, mods, sabor, extra) {
    var o = { id: id, nome: nome, tipo: 'buff', raridade: rar, icone: icone, cores: cores, sabor: sabor, valor: function () { return { mods: mods }; } };
    if (extra) for (var k in extra) o[k] = extra[k];
    nova(o);
  }

  function ouro(id, nome, rar, icone, base, sabor) {
    nova({
      id: id, nome: nome, tipo: 'ouro', raridade: rar, icone: icone, cores: { 1: '#ffd23f', 4: '#b8860b' }, sabor: sabor,
      valor: function (e) { return { ouro: Math.round(base * escalaOuro(e)) }; }
    });
  }

  buff('forca', 'Força Bruta', 'comum', 'espada', { 1: '#d6dde6', 4: '#c93a3a' }, { dano: 2 }, 'Golpes mais pesados.');
  buff('laminas', 'Lâmina Afiada', 'incomum', 'espada', { 1: '#e6f0ff', 4: '#4a9eff' }, { dano: 4 }, 'O fio corta o ar.');
  buff('furia', 'Fúria Ancestral', 'raro', 'espada', { 1: '#ffb0a0', 4: '#c93a3a' }, { dano: 7 }, 'Sangue ferve nas veias.');
  buff('titan', 'Poder do Titã', 'epico', 'espada', { 1: '#d9a6ff', 4: '#7a2cff' }, { dano: 12, vida_maxima: 15 }, 'Força de gigantes.');
  buff('pele', 'Pele Grossa', 'comum', 'escudo', { 1: '#8aa0b8', 4: '#d9b45a' }, { defesa: 2 }, 'Cicatrizes endurecem.');
  buff('muralha', 'Muralha', 'incomum', 'escudo', { 1: '#5fb0ff', 4: '#ffd23f' }, { defesa: 4 }, 'Nada passa.');
  buff('baluarte', 'Baluarte Eterno', 'raro', 'escudo', { 1: '#4a9eff', 4: '#ffffff' }, { defesa: 7, vida_maxima: 20 }, 'Inabalável.');
  buff('vigor', 'Vigor', 'comum', 'coracao', { 1: '#e03a4a', 4: '#ffb0b8' }, { vida_maxima: 15 }, 'Mais fôlego.');
  buff('vitalidade', 'Vitalidade', 'incomum', 'coracao', { 1: '#ff4a6a', 4: '#ffb0b8' }, { vida_maxima: 30 }, 'A vida pulsa forte.');
  buff('gigante', 'Coração de Gigante', 'epico', 'coracao', { 1: '#ff3a5a', 4: '#ffd23f' }, { vida_maxima: 70 }, 'Bate como um tambor.');
  buff('passo', 'Passo Leve', 'comum', 'bota', { 1: '#8a5a2b', 4: '#cfd8e0' }, { velocidade: 0.06 }, 'Pés mais rápidos.');
  buff('vento', 'Botas do Vento', 'raro', 'bota', { 1: '#7ad9ff', 4: '#ffffff' }, { velocidade: 0.15 }, 'Corra como a brisa.');
  buff('reflexo', 'Reflexos Elétricos', 'epico', 'raio', { 1: '#ffe14a', 4: '#ffffff' }, { velocidade: 0.1, dano: 4 }, 'Rápido como um raio.');
  buff('estrela', 'Bênção Estelar', 'lendario', 'estrela', { 1: '#ffd23f', 4: '#ffffff' }, { dano: 5, defesa: 5, vida_maxima: 30, velocidade: 0.1 }, 'Os céus sorriem.');

  nova({ id: 'cura', nome: 'Poção de Cura', tipo: 'buff', raridade: 'comum', icone: 'pocao', cores: { 1: '#ff4a6a', 4: '#8a5a2b' }, sabor: 'Um gole revigorante.', valor: function () { return { cura: 0.5 }; } });
  nova({ id: 'elixir', nome: 'Elixir Completo', tipo: 'buff', raridade: 'incomum', icone: 'pocao', cores: { 1: '#4aff9a', 4: '#8a5a2b' }, sabor: 'Cura todo o grupo.', valor: function () { return { cura: 1, curaAliados: 1 }; } });
  nova({
    id: 'cura_aliados', nome: 'Voz de Comando', tipo: 'buff', raridade: 'incomum', icone: 'aliado', cores: { 1: '#f2c9a0', 4: '#3ac96a' }, sabor: 'Reanima os ajudantes.',
    disponivel: function (e) { return !!(e.jogador.ajudantes && e.jogador.ajudantes.membros.length); },
    valor: function () { return { curaAliados: 1 }; }
  });
  nova({
    id: 'recruta', nome: 'Recruta Leal', tipo: 'buff', raridade: 'raro', icone: 'aliado', cores: { 1: '#f2c9a0', 4: '#3a6bc9' }, sabor: 'Um novo companheiro.', peso: 1.2,
    disponivel: function (e) { return !!(e.jogador.ajudantes && !e.jogador.ajudantes.cheio); },
    valor: function () { return { recruta: {} }; }
  });
  nova({
    id: 'lenda', nome: 'Lenda Convocada', tipo: 'buff', raridade: 'lendario', icone: 'aliado', cores: { 1: '#ffe27a', 4: '#ffb020' }, sabor: 'Um herói de outra era.',
    disponivel: function (e) { return !!(e.jogador.ajudantes && !e.jogador.ajudantes.cheio); },
    valor: function () { return { recruta: { lendario: true } }; }
  });

  ouro('ouro_p', 'Moedas Soltas', 'comum', 'moeda', 25, 'Tilintam no bolso.');
  ouro('ouro_m', 'Bolsa de Ouro', 'incomum', 'bolsa', 80, 'Pesada e generosa.');
  ouro('ouro_g', 'Tesouro Real', 'raro', 'bolsa', 200, 'Cofre da realeza.');
  ouro('ouro_e', 'Baú Amaldiçoado', 'epico', 'moeda', 500, 'Brilha demais.');
  ouro('ouro_l', 'Tesouro do Dragão', 'lendario', 'moeda', 1200, 'Fortuna ancestral.');

  nova({
    id: 'pacto', nome: 'Pacto de Sangue', tipo: 'maldicao', raridade: 'raro', icone: 'caveira', cores: { 1: '#d6a6ff', 4: '#ff4a8a' }, sabor: 'Poder tem preço.',
    disponivel: function (e) { return e.jogador.hpMax >= 60; },
    valor: function (e) { return { mods: { dano: 6, vida_maxima: -Math.round(e.jogador.hpMax * 0.25) } }; }
  });
  nova({
    id: 'fragil', nome: 'Armadura Rachada', tipo: 'maldicao', raridade: 'incomum', icone: 'escudo', cores: { 1: '#8a6a8a', 4: '#ff4a8a' }, sabor: 'Ouro por proteção.',
    disponivel: function (e) { return e.jogador.stats.defesa >= 3; },
    valor: function (e) { return { mods: { defesa: -3 }, ouro: Math.round(100 * escalaOuro(e)) }; }
  });
  nova({
    id: 'lento', nome: 'Peso do Pecado', tipo: 'maldicao', raridade: 'incomum', icone: 'ampulheta', cores: { 1: '#b99aff', 4: '#ff4a8a' }, sabor: 'Passos de chumbo.',
    disponivel: function (e) { return e.jogador.base.velocidade >= 0.7; },
    valor: function () { return { mods: { velocidade: -0.12, dano: 5 } }; }
  });
  nova({
    id: 'dizimo', nome: 'Dízimo Maldito', tipo: 'maldicao', raridade: 'raro', icone: 'bolsa', cores: { 1: '#6a3a8a', 4: '#ff4a8a' }, sabor: 'Ouro alimenta o ritual.',
    disponivel: function (e) { return (e.jogador.ouro || 0) >= 60; },
    valor: function () { return { ouroPct: -0.4, mods: { dano: 4, defesa: 3 } }; }
  });
  nova({
    id: 'contrato', nome: 'Contrato Sombrio', tipo: 'maldicao', raridade: 'epico', icone: 'caveira', cores: { 1: '#a64aff', 4: '#ff4a8a' }, sabor: 'Assine com sangue.',
    valor: function () { return { hpPct: -0.4, mods: { dano: 12, defesa: 3 } }; }
  });
  nova({
    id: 'cobica', nome: 'Cobiça Amaldiçoada', tipo: 'maldicao', raridade: 'epico', icone: 'bolsa', cores: { 1: '#8a4aff', 4: '#ffd23f' }, sabor: 'Nunca é o bastante.',
    valor: function (e) { return { ouro: Math.round(400 * escalaOuro(e)), mods: { vida_maxima: -20 } }; }
  });
  nova({
    id: 'chama_proibida', nome: 'Chama Proibida', tipo: 'maldicao', raridade: 'epico', icone: 'chama', cores: { 1: '#a64aff', 4: '#ff4a8a' }, sabor: 'Queima por dentro.',
    disponivel: function (e) { return e.jogador.stats.defesa >= 4; },
    valor: function () { return { mods: { dano: 10, defesa: -4 } }; }
  });
  nova({
    id: 'abandono', nome: 'Abandono', tipo: 'maldicao', raridade: 'epico', icone: 'aliado', cores: { 1: '#8a6a8a', 4: '#ff4a8a' }, sabor: 'Sozinho, mais forte.',
    disponivel: function (e) { return !!(e.jogador.ajudantes && e.jogador.ajudantes.membros.length); },
    valor: function () { return { perdeAliado: true, mods: { dano: 8, defesa: 6 } }; }
  });
  nova({
    id: 'abismo', nome: 'Pacto do Abismo', tipo: 'maldicao', raridade: 'lendario', icone: 'caveira', cores: { 1: '#7a2cff', 4: '#ff4a8a' }, sabor: 'O vazio responde.',
    disponivel: function (e) { return e.jogador.hpMax >= 100; },
    valor: function (e) { return { mods: { dano: 20, vida_maxima: -Math.round(e.jogador.hpMax * 0.4) } }; }
  });

  function chave(id, mundo, rar, sabor, minMundo) {
    nova({
      id: id, nome: 'Chave: ' + nomeMundo(mundo), tipo: 'chave', raridade: rar, icone: 'chave', sabor: sabor, peso: 1,
      cores: function () { return { 1: corMundo(mundo), 4: '#ffffff' }; },
      disponivel: function (e) { return !!(e.campanha && e.campanha.mundo < mundo && e.campanha.mundo >= (minMundo || 1)); },
      valor: function () { return { chave: mundo }; }
    });
  }

  chave('chave_cripta', 2, 'raro', 'Abre as catacumbas.');
  chave('chave_pantano', 3, 'raro', 'Abre o pântano.');
  chave('chave_vulcao', 4, 'epico', 'Abre o vulcão.');
  chave('chave_vazio', 5, 'lendario', 'Abre o abismo final.', 3);

  function aplicarMods(j, mods) {
    var b = j.base;
    for (var k in mods) {
      var v = (b[k] || 0) + mods[k];
      if (k === 'vida_maxima') v = Math.max(20, v);
      if (k === 'velocidade') v = Math.max(0.4, v);
      if (k === 'defesa') v = Math.max(-8, v);
      if (k === 'dano') v = Math.max(1, v);
      b[k] = Math.round(v * 1000) / 1000;
    }
    j.recalcular(false);
  }

  function equipamentoLendario() {
    if (!GI) return null;
    var lista = GI.listarPorRaridade('lendario');
    var porSlot = function (s) {
      var r = lista.filter(function (i) { return i.slot === s; });
      return r.length ? r[Math.floor(Math.random() * r.length)].id : null;
    };
    return { arma: porSlot('arma'), capacete: porSlot('capacete'), peitoral: porSlot('peitoral'), botas: porSlot('botas') };
  }

  var Chaves = {
    viajar: function (campanha, destino) {
      if (!campanha || !campanha.arena) return false;
      var maxM = GW ? GW.MUNDOS : 4;
      var maxS = GW ? GW.SUBNIVEIS : 10;
      var d = limitar(destino, 1, maxM + 1);
      if (campanha.estado === 'transicao') {
        campanha.mundo = d - 1;
        campanha.sub = maxS;
        return true;
      }
      if (campanha.estado === 'jogando') {
        campanha.mundo = d;
        campanha.sub = 1;
        campanha.iniciarArena();
        return true;
      }
      return false;
    }
  };

  function executar(v, e, opcoes) {
    var j = e.jogador;
    var msgs = [];
    if (v.mods) aplicarMods(j, v.mods);
    if (v.hpPct) j.hp = Math.max(1, Math.round(j.hp * (1 + v.hpPct)));
    if (v.cura) j.curar(Math.round(j.hpMax * v.cura));
    if (v.curaAliados && j.ajudantes) {
      for (var i = 0; i < j.ajudantes.membros.length; i++) {
        j.ajudantes.membros[i].curar(Math.round(j.ajudantes.membros[i].hpMax * v.curaAliados));
      }
    }
    if (v.ouro) j.ouro = Math.max(0, (j.ouro || 0) + v.ouro);
    if (v.ouroPct) j.ouro = Math.max(0, Math.round((j.ouro || 0) * (1 + v.ouroPct)));
    if (v.recruta && j.ajudantes && !j.ajudantes.cheio) {
      var opc = { aleatorio: true };
      if (v.recruta.lendario) {
        var eq = equipamentoLendario();
        if (eq) opc = { equipamento: eq };
      }
      var novo = j.ajudantes.adicionar(opc);
      if (novo) msgs.push(novo.nome + ' se juntou ao grupo');
    }
    if (v.perdeAliado && j.ajudantes && j.ajudantes.membros.length) {
      var lista = j.ajudantes.membros;
      var alvo = lista[Math.floor(Math.random() * lista.length)];
      j.ajudantes.remover(alvo);
      msgs.push(alvo.nome + ' partiu');
    }
    if (v.chave) {
      j.chaves = j.chaves || [];
      if (j.chaves.indexOf(v.chave) < 0) j.chaves.push(v.chave);
      if (!opcoes || opcoes.chaveImediata !== false) {
        if (Chaves.viajar(e.campanha, v.chave)) {
          j.chaves.splice(j.chaves.indexOf(v.chave), 1);
          msgs.push('Portal aberto: ' + nomeMundo(v.chave));
        }
      }
    }
    return msgs.join(' | ');
  }

  var ROTULOS_MODS = { dano: 'Dano', defesa: 'Defesa', vida_maxima: 'Vida máx.', velocidade: 'Velocidade' };

  function linhasDe(carta) {
    var v = carta.valor;
    var L = [];
    var ordem = ['dano', 'defesa', 'vida_maxima', 'velocidade'];
    var i;
    if (v.mods) {
      for (i = 0; i < ordem.length; i++) {
        var k = ordem[i];
        var q = v.mods[k];
        if (!q) continue;
        var txt = k === 'velocidade' ? Math.abs(Math.round(q * 100)) + '%' : String(Math.abs(q));
        L.push({ t: (q > 0 ? '+' : '-') + txt + ' ' + ROTULOS_MODS[k], c: q > 0 ? '#7aff9a' : '#ff8a8a' });
      }
    }
    if (v.cura) L.push({ t: '+' + Math.round(v.cura * 100) + '% de Vida', c: '#7aff9a' });
    if (v.curaAliados) L.push({ t: 'Cura os ajudantes', c: '#7aff9a' });
    if (v.ouro) L.push({ t: (v.ouro > 0 ? '+' : '-') + Math.abs(v.ouro) + ' Ouro', c: v.ouro > 0 ? '#ffd23f' : '#ff8a8a' });
    if (v.ouroPct) L.push({ t: Math.round(v.ouroPct * 100) + '% do Ouro', c: '#ff8a8a' });
    if (v.hpPct) L.push({ t: Math.round(v.hpPct * 100) + '% da Vida atual', c: '#ff8a8a' });
    if (v.recruta) L.push({ t: '+1 Ajudante' + (v.recruta.lendario ? ' lendário' : ''), c: '#7aff9a' });
    if (v.perdeAliado) L.push({ t: '-1 Ajudante (aleatório)', c: '#ff8a8a' });
    if (v.chave) {
      L.push({ t: 'Viaja para o mundo ' + v.chave, c: '#6ad1ff' });
      L.push({ t: nomeMundo(v.chave), c: '#6ad1ff' });
    }
    if (carta.sabor) L.push({ t: carta.sabor, c: '#8a8aa4' });
    return L;
  }

  function instanciar(def, estado, rng) {
    var valor = def.valor ? def.valor(estado) : {};
    var cores = typeof def.cores === 'function' ? def.cores(estado) : def.cores;
    var c = {
      id: def.id,
      def: def,
      nome: def.nome,
      tipo: def.tipo,
      raridade: def.raridade,
      icone: def.icone,
      sabor: def.sabor,
      valor: valor,
      seed: Math.floor(rng() * 1000000000),
      paleta: paletaIcone(cores),
      matriz: matrizIcone(def.icone)
    };
    c.linhas = linhasDe(c);
    return c;
  }

  function elegiveis(estado) {
    var j = estado.jogador;
    var tomadas = j && j.cartas ? j.cartas : [];
    return CARTAS.filter(function (d) {
      if (d.unica && tomadas.indexOf(d.id) >= 0) return false;
      return !d.disponivel || d.disponivel(estado);
    });
  }

  function pesoDe(def, estado, escolhidas) {
    var r = RAR[def.raridade];
    var bonus = 1 + 0.012 * (Math.max(1, estado.nivel) - 1) + 0.5 * (estado.sorte || 0);
    var w = r.peso * Math.pow(bonus, r.nivel) * (TIPOS[def.tipo].peso || 1) * (def.peso || 1);
    var repetidos = 0;
    for (var i = 0; i < escolhidas.length; i++) {
      if (escolhidas[i].tipo === def.tipo) repetidos++;
    }
    return w * Math.pow(0.45, repetidos);
  }

  function roleta(lista, estado, escolhidas, rng) {
    var total = 0;
    var pesos = lista.map(function (d) {
      var w = pesoDe(d, estado, escolhidas);
      total += w;
      return w;
    });
    var r = rng() * total;
    for (var i = 0; i < lista.length; i++) {
      r -= pesos[i];
      if (r <= 0) return lista[i];
    }
    return lista[lista.length - 1];
  }

  function sortear(estado, n, rng) {
    rng = rng || Math.random;
    n = n || 3;
    var todas = elegiveis(estado);
    var pool = todas.slice();
    var escolhidas = [];
    while (escolhidas.length < n && pool.length) {
      var d = roleta(pool, estado, escolhidas, rng);
      escolhidas.push(d);
      pool = pool.filter(function (x) { return x.id !== d.id; });
    }
    if (escolhidas.length === n && escolhidas.every(function (d) { return d.tipo === 'maldicao'; })) {
      var alt = pool.filter(function (d) { return d.tipo !== 'maldicao'; });
      if (!alt.length) {
        alt = todas.filter(function (d) {
          return d.tipo !== 'maldicao' && escolhidas.indexOf(d) < 0;
        });
      }
      if (alt.length) escolhidas[n - 1] = roleta(alt, estado, [], rng);
    }
    return escolhidas.map(function (d) { return instanciar(d, estado, rng); });
  }

  function medir(ctx, t) {
    var m = ctx.measureText(t);
    return m && typeof m.width === 'number' ? m.width : t.length * 6;
  }

  function quebrar(ctx, texto, larguraMax) {
    var palavras = texto.split(' ');
    var linhas = [];
    var atual = '';
    for (var i = 0; i < palavras.length; i++) {
      var teste = atual ? atual + ' ' + palavras[i] : palavras[i];
      if (medir(ctx, teste) > larguraMax && atual) {
        linhas.push(atual);
        atual = palavras[i];
      } else {
        atual = teste;
      }
    }
    if (atual) linhas.push(atual);
    return linhas;
  }

  function fonte(ctx, tam, negrito) {
    ctx.font = (negrito ? 'bold ' : '') + tam + 'px monospace';
  }

  function texto(ctx, t, x, y, cor, alinhar) {
    ctx.textAlign = alinhar || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PRETO;
    ctx.fillText(t, Math.round(x) + 1, Math.round(y) + 1);
    ctx.fillStyle = cor;
    ctx.fillText(t, Math.round(x), Math.round(y));
  }

  function notch(ctx, cor, x, y, w, h, u) {
    ctx.fillStyle = cor;
    ctx.fillRect(Math.round(x + u), Math.round(y), Math.round(w - 2 * u), Math.round(h));
    ctx.fillRect(Math.round(x), Math.round(y + u), Math.round(w), Math.round(h - 2 * u));
  }

  function moldura(ctx, x, y, w, h, u, R, t) {
    var faixa = u * (R.nivel >= 2 ? 3 : 2);
    var claro = misturar(R.cor, '#ffffff', 0.45);
    var escuro = ajustar(R.cor, 0.6);
    if (R.nivel >= 3) {
      ctx.globalAlpha = 0.12 + 0.08 * Math.sin(t * 3);
      ret(ctx, R.cor, x - u * 2, y - u * 2, w + u * 4, h + u * 4);
      ctx.globalAlpha = 1;
    }
    notch(ctx, PRETO, x, y, w, h, u);
    notch(ctx, R.cor, x + u, y + u, w - 2 * u, h - 2 * u, u);
    ret(ctx, claro, x + u * 2, y + u, w - u * 4, Math.max(1, u - 1));
    ret(ctx, claro, x + u, y + u * 2, Math.max(1, u - 1), h - u * 4);
    ret(ctx, escuro, x + u * 2, y + h - u * 2, w - u * 4, Math.max(1, u - 1));
    ret(ctx, escuro, x + w - u * 2, y + u * 2, Math.max(1, u - 1), h - u * 4);
    var o2 = u + faixa;
    notch(ctx, R.escuro, x + o2, y + o2, w - 2 * o2, h - 2 * o2, u);
    var o3 = o2 + u;
    notch(ctx, R.fundo, x + o3, y + o3, w - 2 * o3, h - 2 * o3, u);
    if (R.nivel >= 2) {
      var cantos = [[x, y], [x + w - 4 * u, y], [x, y + h - 4 * u], [x + w - 4 * u, y + h - 4 * u]];
      for (var i = 0; i < cantos.length; i++) {
        ret(ctx, PRETO, cantos[i][0], cantos[i][1], 4 * u, 4 * u);
        ret(ctx, R.cor, cantos[i][0] + u, cantos[i][1] + u, 2 * u, 2 * u);
        ret(ctx, claro, cantos[i][0] + u, cantos[i][1] + u, u, u);
      }
    }
    if (R.nivel >= 3) {
      var mx = x + w / 2 - u * 2;
      ret(ctx, PRETO, mx, y, 4 * u, 3 * u);
      ret(ctx, R.cor, mx + u, y + u, 2 * u, u);
      ret(ctx, PRETO, mx, y + h - 3 * u, 4 * u, 3 * u);
      ret(ctx, R.cor, mx + u, y + h - 2 * u, 2 * u, u);
    }
    if (R.nivel >= 4) {
      var passo = u * 4;
      var fase = Math.floor(t * 8);
      var n = Math.floor((w - u * 8) / passo);
      var k;
      for (k = 0; k < n; k++) {
        if ((k + fase) % 6 === 0) {
          ret(ctx, '#fff6c0', x + u * 4 + k * passo, y + u, u * 2, u);
          ret(ctx, '#fff6c0', x + u * 4 + (n - 1 - k) * passo, y + h - u * 2, u * 2, u);
        }
      }
      var m = Math.floor((h - u * 8) / passo);
      for (k = 0; k < m; k++) {
        if ((k + fase) % 6 === 0) {
          ret(ctx, '#fff6c0', x + u, y + u * 4 + k * passo, u, u * 2);
          ret(ctx, '#fff6c0', x + w - u * 2, y + u * 4 + (m - 1 - k) * passo, u, u * 2);
        }
      }
    }
    return o3;
  }

  function desenharArte(ctx, c, x, y, w, h, u, t) {
    var R = RAR[c.raridade];
    ret(ctx, PRETO, x - u, y - u, w + 2 * u, h + 2 * u);
    ret(ctx, R.arte, x, y, w, h);
    var px = Math.max(2, Math.floor(Math.min(w, h) * 0.78 / 12));
    var pxb = Math.max(2, Math.floor(px / 2));
    var bw = Math.floor(w / pxb);
    var bh = Math.floor(h / pxb);
    if (!c._fundo || c._fundo.bw !== bw || c._fundo.bh !== bh) {
      c._fundo = { bw: bw, bh: bh, m: gerarFundo(c.seed, bw, bh, R.nivel) };
    }
    var ox = x + Math.floor((w - bw * pxb) / 2);
    var oy = y + Math.floor((h - bh * pxb) / 2);
    desenharMatriz(ctx, c._fundo.m, { '2': ajustar(R.arte, 0.78), '3': misturar(R.arte, R.cor, 0.3), '4': misturar(R.cor, '#ffffff', 0.5) }, ox, oy, pxb);
    var tam = 12 * px;
    var ix = x + Math.round((w - tam) / 2);
    var iy = y + Math.round((h - tam) / 2);
    var bob = Math.floor(t * 2.5) % 2 === 0 ? 0 : -px;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(ix + px * 2, iy + tam - px, px * 8, px);
    desenharMatriz(ctx, c.matriz, c.paleta, ix, iy + bob, px);
    if (R.nivel >= 2) {
      var rng = mulberry32(c.seed + 7);
      var n = R.nivel * 2;
      for (var i = 0; i < n; i++) {
        var sx = x + Math.floor(rng() * (w - pxb * 3));
        var sy = y + Math.floor(rng() * (h - pxb * 3));
        if ((Math.floor(t * 3) + i) % 4 !== 0) continue;
        var cs = misturar(R.cor, '#ffffff', 0.7);
        ret(ctx, cs, sx + pxb, sy, pxb, pxb * 3);
        ret(ctx, cs, sx, sy + pxb, pxb * 3, pxb);
      }
    }
  }

  function ajustarTexto(ctx, linhas, larg, altMax, tamIni, tamMin) {
    var tam = tamIni;
    var saida;
    while (tam >= tamMin) {
      fonte(ctx, tam, false);
      saida = [];
      for (var i = 0; i < linhas.length; i++) {
        var q = quebrar(ctx, linhas[i].t, larg);
        for (var k = 0; k < q.length; k++) saida.push({ t: q[k], c: linhas[i].c });
      }
      if (saida.length * (tam + 3) <= altMax) return { tam: tam, linhas: saida };
      tam--;
    }
    fonte(ctx, tamMin, false);
    return { tam: tamMin, linhas: saida.slice(0, Math.max(1, Math.floor(altMax / (tamMin + 3)))) };
  }

  function desenharCarta(ctx, c, x, y, w, h, op) {
    op = op || {};
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    var t = op.t || 0;
    var modo = op.modo || 'coluna';
    var R = RAR[c.raridade];
    var T = TIPOS[c.tipo];
    var u = Math.min(w, h) >= 190 ? 3 : 2;
    ctx.save();
    if (op.alfa !== undefined) ctx.globalAlpha = op.alfa;
    var ins = moldura(ctx, x, y, w, h, u, R, t);
    var cx = x + ins;
    var cy = y + ins;
    var cw = w - 2 * ins;
    var ch = h - 2 * ins;
    var pad = u * 2;
    var i;
    if (modo === 'coluna') {
      var tagH = Math.max(14, Math.round(ch * 0.08));
      ret(ctx, T.cor, cx, cy, cw, tagH);
      ret(ctx, ajustar(T.cor, 0.6), cx, cy + tagH - 2, cw, 2);
      fonte(ctx, Math.max(8, Math.round(tagH * 0.68)), true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = T.texto;
      ctx.fillText(T.nome, Math.round(cx + cw / 2), Math.round(cy + tagH / 2 + 1));
      var arteY = cy + tagH + pad + u;
      var arteW = cw - 2 * pad - 2 * u;
      var arteH = Math.round(ch * 0.36);
      desenharArte(ctx, c, cx + pad + u, arteY, arteW, arteH, u, t);
      var fh = Math.max(14, Math.round(ch * 0.075));
      var ty = arteY + arteH + pad + u;
      var tamNome = limitar(Math.round(cw / 13), 10, 17);
      fonte(ctx, tamNome, true);
      var nomeL = quebrar(ctx, c.nome, cw - 2 * pad);
      for (i = 0; i < nomeL.length && i < 2; i++) {
        texto(ctx, nomeL[i], cx + cw / 2, ty + tamNome + i * (tamNome + 2), '#ffffff', 'center');
      }
      ty += Math.min(2, nomeL.length) * (tamNome + 2) + 4;
      ret(ctx, R.escuro, cx + pad * 2, ty, cw - pad * 4, 2);
      ty += 8;
      var altDesc = cy + ch - fh - 6 - ty;
      var aj = ajustarTexto(ctx, c.linhas, cw - 2 * pad, altDesc, limitar(Math.round(cw / 16), 9, 13), 8);
      fonte(ctx, aj.tam, false);
      for (i = 0; i < aj.linhas.length; i++) {
        texto(ctx, aj.linhas[i].t, cx + cw / 2, ty + aj.tam + i * (aj.tam + 3), aj.linhas[i].c, 'center');
      }
      ret(ctx, R.escuro, cx, cy + ch - fh, cw, fh);
      fonte(ctx, Math.max(8, Math.round(fh * 0.62)), true);
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = R.cor;
      ctx.fillText(R.nome, Math.round(cx + cw / 2), Math.round(cy + ch - fh / 2 + 1));
    } else {
      var lado = ch - 2 * pad - 2 * u;
      desenharArte(ctx, c, cx + pad + u, cy + pad + u, lado, lado, u, t);
      var tx = cx + pad + u + lado + pad * 2;
      var tw = cx + cw - pad - tx;
      var tamTag = limitar(Math.round(ch / 9), 9, 13);
      fonte(ctx, tamTag, true);
      var larguraTag = Math.round(medir(ctx, T.nome) + 12);
      ret(ctx, T.cor, tx, cy + pad, larguraTag, tamTag + 6);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = T.texto;
      ctx.fillText(T.nome, tx + 6, Math.round(cy + pad + (tamTag + 6) / 2 + 1));
      fonte(ctx, tamTag, true);
      ctx.textAlign = 'right';
      ctx.fillStyle = R.cor;
      ctx.fillText(R.nome, Math.round(tx + tw), Math.round(cy + pad + (tamTag + 6) / 2 + 1));
      var tn = limitar(Math.round(ch / 7), 11, 18);
      fonte(ctx, tn, true);
      var yy = cy + pad + tamTag + 6 + tn + 4;
      texto(ctx, c.nome, tx, yy, '#ffffff', 'left');
      var altD = cy + ch - pad - yy - 4;
      var aj2 = ajustarTexto(ctx, c.linhas, tw, altD, limitar(Math.round(ch / 9), 9, 13), 8);
      fonte(ctx, aj2.tam, false);
      for (i = 0; i < aj2.linhas.length; i++) {
        texto(ctx, aj2.linhas[i].t, tx, yy + 6 + aj2.tam + i * (aj2.tam + 3), aj2.linhas[i].c, 'left');
      }
    }
    if (op.numero) {
      var s = u * 6;
      ret(ctx, PRETO, x + u, y + u, s + u, s + u);
      ret(ctx, R.cor, x + u * 2, y + u * 2, s - u, s - u);
      fonte(ctx, Math.max(9, s), true);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = PRETO;
      ctx.fillText(String(op.numero), Math.round(x + u * 2 + (s - u) / 2), Math.round(y + u * 2 + (s - u) / 2 + 1));
    }
    if (op.brilho) {
      ctx.globalAlpha = op.brilho;
      ret(ctx, '#ffffff', x + u, y + u, w - 2 * u, h - 2 * u);
    }
    ctx.restore();
  }

  class Draft {
    constructor(o) {
      o = o || {};
      this.jogador = o.jogador || null;
      this.campanha = o.campanha || null;
      this.canvas = null;
      this.largura = o.largura || 960;
      this.altura = o.altura || 640;
      this.aoEscolher = o.aoEscolher || null;
      this.aoFechar = o.aoFechar || null;
      this.rng = o.rng || Math.random;
      this.quantidade = o.quantidade || 3;
      this.chaveImediata = o.chaveImediata !== false;
      this.debugHitboxes = !!o.debugHitboxes;
      this.aberto = false;
      this.cartas = [];
      this.rects = [];
      this.modo = 'coluna';
      this.t = 0;
      this.tEscolha = 0;
      this.hover = -1;
      this.foco = -1;
      this.pressionado = -1;
      this.escolhida = -1;
      this.resultado = null;
      this.subtitulo = '';
      this.estado = null;
      this.folgaToque = 12;
      this.manipuladores = null;
      this.estilosOriginais = null;
    }

    abrir(opcoes) {
      opcoes = opcoes || {};
      var camp = this.campanha;
      this.estado = {
        jogador: this.jogador,
        campanha: camp,
        nivel: camp ? camp.nivelGlobal : (opcoes.nivel || 1),
        mundo: camp ? camp.mundo : 1,
        sub: camp ? camp.sub : 1,
        sorte: opcoes.sorte || 0
      };
      if (this.jogador && !this.jogador.cartas) this.jogador.cartas = [];
      this.cartas = sortear(this.estado, this.quantidade, this.rng);
      this.aberto = this.cartas.length > 0;
      this.t = 0;
      this.tEscolha = 0;
      this.hover = -1;
      this.foco = -1;
      this.pressionado = -1;
      this.escolhida = -1;
      this.resultado = null;
      this.subtitulo = camp ? nomeMundo(camp.mundo) + '  -  Nível ' + camp.mundo + '-' + camp.sub + ' concluído' : '';
      this.layout();
      return this.cartas;
    }

    escolher(i) {
      if (!this.aberto || this.escolhida >= 0 || !this.cartas[i]) return null;
      var c = this.cartas[i];
      this.escolhida = i;
      this.tEscolha = 0;
      this.pressionado = -1;
      var mensagem = executar(c.valor, this.estado, { chaveImediata: this.chaveImediata });
      if (this.jogador) {
        this.jogador.cartas = this.jogador.cartas || [];
        this.jogador.cartas.push(c.id);
      }
      this.resultado = { carta: c, mensagem: mensagem };
      if (this.aoEscolher) this.aoEscolher(c, mensagem);
      return this.resultado;
    }

    fechar() {
      var r = this.resultado;
      this.aberto = false;
      this.rects = [];
      this.hover = -1;
      this.foco = -1;
      this.pressionado = -1;
      if (this.aoFechar) this.aoFechar(r ? r.carta : null, r ? r.mensagem : '');
    }

    interativo() {
      return this.aberto && this.escolhida < 0 && this.t >= 0.35;
    }

    layout() {
      var cv = this.canvas;
      if (cv) {
        this.largura = cv.width;
        this.altura = cv.height;
      }
      var W = this.largura;
      var H = this.altura;
      var n = this.cartas.length || 3;
      this.folgaToque = Math.max(10, Math.round(Math.min(W, H) * 0.02));
      this.rects = [];
      var i;
      if (W >= 640 && W >= H * 0.9) {
        this.modo = 'coluna';
        var gap = Math.round(W * 0.025);
        var cw = Math.min(Math.round((W - gap * (n + 1)) / n), 250);
        var ch = Math.min(Math.round(H * 0.74), Math.round(cw * 1.55));
        var total = cw * n + gap * (n - 1);
        var x0 = Math.round((W - total) / 2);
        var y0 = Math.round((H - ch) / 2) + Math.round(H * 0.03);
        for (i = 0; i < n; i++) this.rects.push({ x: x0 + i * (cw + gap), y: y0, w: cw, h: ch });
      } else {
        this.modo = 'linha';
        var margem = Math.round(W * 0.04);
        var cw2 = W - 2 * margem;
        var gap2 = Math.max(8, Math.round(H * 0.018));
        var ch2 = Math.min(Math.round((H * 0.78 - gap2 * (n - 1)) / n), Math.round(cw2 * 0.6));
        var total2 = ch2 * n + gap2 * (n - 1);
        var y1 = Math.round((H - total2) / 2) + Math.round(H * 0.03);
        for (i = 0; i < n; i++) this.rects.push({ x: margem, y: y1 + i * (ch2 + gap2), w: cw2, h: ch2 });
      }
    }

    hitboxes() {
      var f = this.folgaToque;
      return this.rects.map(function (r, i) {
        return { indice: i, x: r.x - f, y: r.y - f, w: r.w + 2 * f, h: r.h + 2 * f };
      });
    }

    cartaEm(x, y, toque) {
      var folga = toque ? this.folgaToque : 2;
      var melhor = -1;
      var menor = Infinity;
      for (var i = 0; i < this.rects.length; i++) {
        var r = this.rects[i];
        if (x >= r.x - folga && x <= r.x + r.w + folga && y >= r.y - folga && y <= r.y + r.h + folga) {
          var dx = x - (r.x + r.w / 2);
          var dy = y - (r.y + r.h / 2);
          var d = dx * dx + dy * dy;
          if (d < menor) {
            menor = d;
            melhor = i;
          }
        }
      }
      return melhor;
    }

    paraCanvas(p) {
      var cv = this.canvas;
      var r = cv.getBoundingClientRect();
      var sx = r.width ? cv.width / r.width : 1;
      var sy = r.height ? cv.height / r.height : 1;
      return { x: (p.clientX - r.left) * sx, y: (p.clientY - r.top) * sy };
    }

    ligar(canvas) {
      if (this.canvas) this.desligar();
      var self = this;
      this.canvas = canvas;
      this.estilosOriginais = {
        touchAction: canvas.style.touchAction,
        userSelect: canvas.style.userSelect,
        tap: canvas.style.webkitTapHighlightColor
      };
      canvas.style.touchAction = 'none';
      canvas.style.userSelect = 'none';
      canvas.style.webkitTapHighlightColor = 'transparent';
      this.layout();

      var descer = function (p, toque, e) {
        if (!self.interativo()) return;
        var pos = self.paraCanvas(p);
        var i = self.cartaEm(pos.x, pos.y, toque);
        self.pressionado = i;
        self.hover = toque ? -1 : i;
        self.foco = -1;
        if (i >= 0 && e.cancelable) e.preventDefault();
      };
      var mover = function (p, toque) {
        if (!self.interativo()) return;
        var pos = self.paraCanvas(p);
        var i = self.cartaEm(pos.x, pos.y, toque);
        if (!toque) {
          self.hover = i;
          canvas.style.cursor = i >= 0 ? 'pointer' : 'default';
        }
        if (self.pressionado >= 0 && i !== self.pressionado) self.pressionado = -1;
      };
      var subir = function (p, toque, e) {
        if (!self.interativo()) {
          self.pressionado = -1;
          return;
        }
        var pos = self.paraCanvas(p);
        var i = self.cartaEm(pos.x, pos.y, toque);
        var alvo = self.pressionado;
        self.pressionado = -1;
        if (i >= 0 && i === alvo) {
          if (e.cancelable) e.preventDefault();
          self.escolher(i);
        }
      };
      var cancelar = function () {
        self.pressionado = -1;
        self.hover = -1;
      };

      this.manipuladores = {
        tecla: function (e) {
          if (!self.interativo()) return;
          var k = e.key;
          var n = self.cartas.length;
          if (k === '1' || k === '2' || k === '3') {
            var i = parseInt(k, 10) - 1;
            if (i < n) {
              e.preventDefault();
              self.escolher(i);
            }
          } else if (k === 'ArrowLeft' || k === 'ArrowUp') {
            e.preventDefault();
            self.hover = -1;
            self.foco = self.foco < 0 ? 0 : (self.foco - 1 + n) % n;
          } else if (k === 'ArrowRight' || k === 'ArrowDown') {
            e.preventDefault();
            self.hover = -1;
            self.foco = self.foco < 0 ? 0 : (self.foco + 1) % n;
          } else if ((k === 'Enter' || k === ' ') && self.foco >= 0 && !e.repeat) {
            e.preventDefault();
            self.escolher(self.foco);
          }
        },
        redimensionar: function () {
          if (self.aberto) self.layout();
        }
      };
      global.addEventListener('keydown', this.manipuladores.tecla);
      global.addEventListener('resize', this.manipuladores.redimensionar);

      if (global.PointerEvent) {
        this.manipuladores.pointerdown = function (e) {
          var toque = e.pointerType !== 'mouse';
          descer(e, toque, e);
          if (self.pressionado >= 0) {
            try { canvas.setPointerCapture(e.pointerId); } catch (err) { return; }
          }
        };
        this.manipuladores.pointermove = function (e) { mover(e, e.pointerType !== 'mouse'); };
        this.manipuladores.pointerup = function (e) { subir(e, e.pointerType !== 'mouse', e); };
        this.manipuladores.pointercancel = cancelar;
        this.manipuladores.pointerleave = function (e) {
          if (e.pointerType === 'mouse') {
            self.hover = -1;
            canvas.style.cursor = 'default';
          }
        };
        canvas.addEventListener('pointerdown', this.manipuladores.pointerdown);
        canvas.addEventListener('pointermove', this.manipuladores.pointermove);
        canvas.addEventListener('pointerup', this.manipuladores.pointerup);
        canvas.addEventListener('pointercancel', this.manipuladores.pointercancel);
        canvas.addEventListener('pointerleave', this.manipuladores.pointerleave);
      } else {
        this.manipuladores.mousedown = function (e) { descer(e, false, e); };
        this.manipuladores.mousemove = function (e) { mover(e, false); };
        this.manipuladores.mouseup = function (e) { subir(e, false, e); };
        this.manipuladores.touchstart = function (e) { if (e.changedTouches[0]) descer(e.changedTouches[0], true, e); };
        this.manipuladores.touchmove = function (e) { if (e.changedTouches[0]) mover(e.changedTouches[0], true); };
        this.manipuladores.touchend = function (e) { if (e.changedTouches[0]) subir(e.changedTouches[0], true, e); };
        this.manipuladores.touchcancel = cancelar;
        canvas.addEventListener('mousedown', this.manipuladores.mousedown);
        canvas.addEventListener('mousemove', this.manipuladores.mousemove);
        canvas.addEventListener('mouseup', this.manipuladores.mouseup);
        canvas.addEventListener('touchstart', this.manipuladores.touchstart, { passive: false });
        canvas.addEventListener('touchmove', this.manipuladores.touchmove, { passive: false });
        canvas.addEventListener('touchend', this.manipuladores.touchend, { passive: false });
        canvas.addEventListener('touchcancel', this.manipuladores.touchcancel);
      }
      return this;
    }

    desligar() {
      var cv = this.canvas;
      var m = this.manipuladores;
      if (!cv || !m) return;
      global.removeEventListener('keydown', m.tecla);
      global.removeEventListener('resize', m.redimensionar);
      var eventos = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerleave', 'mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'touchcancel'];
      for (var i = 0; i < eventos.length; i++) {
        if (m[eventos[i]]) cv.removeEventListener(eventos[i], m[eventos[i]]);
      }
      var o = this.estilosOriginais || {};
      cv.style.touchAction = o.touchAction || '';
      cv.style.userSelect = o.userSelect || '';
      cv.style.webkitTapHighlightColor = o.tap || '';
      cv.style.cursor = 'default';
      this.manipuladores = null;
      this.canvas = null;
    }

    vincularCampanha(campanha, jogador) {
      var self = this;
      var anterior = campanha.aoEvento;
      this.campanha = campanha;
      if (jogador) this.jogador = jogador;
      campanha.aoEvento = function (tipo, dados) {
        if (anterior) anterior(tipo, dados);
        if (tipo === 'nivel_completo' && !self.aberto) {
          var maxM = GW ? GW.MUNDOS : 4;
          if (dados && dados.mundo > maxM) return;
          var maxS = GW ? GW.SUBNIVEIS : 10;
          self.abrir({ sorte: dados && dados.sub === maxS ? 1 : 0 });
        }
      };
      return this;
    }

    update(dt) {
      if (!this.aberto) return;
      this.t += dt;
      if (this.escolhida >= 0) {
        this.tEscolha += dt;
        if (this.tEscolha >= 0.7) this.fechar();
      }
    }

    draw(ctx) {
      if (!this.aberto) return;
      var W = this.largura;
      var H = this.altura;
      var i;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = Math.min(1, this.t / 0.2) * 0.82;
      ret(ctx, '#05040a', 0, 0, W, H);
      ctx.globalAlpha = 1;
      var tamTitulo = Math.max(14, Math.round(Math.min(W, H) / 22));
      fonte(ctx, tamTitulo, true);
      texto(ctx, 'ESCOLHA UMA CARTA', W / 2, Math.round(H * 0.07) + tamTitulo / 2, '#ffffff', 'center');
      if (this.subtitulo) {
        var tamSub = Math.max(10, Math.round(tamTitulo * 0.55));
        fonte(ctx, tamSub, false);
        texto(ctx, this.subtitulo, W / 2, Math.round(H * 0.07) + tamTitulo / 2 + tamSub + 8, '#9a9ab4', 'center');
      }
      var ordem = [];
      for (i = 0; i < this.cartas.length; i++) {
        if (i !== this.escolhida) ordem.push(i);
      }
      if (this.escolhida >= 0) ordem.push(this.escolhida);
      for (var k = 0; k < ordem.length; k++) {
        i = ordem[k];
        var r = this.rects[i];
        if (!r) continue;
        var rev = limitar((this.t - i * 0.12) / 0.35, 0, 1);
        var e = 1 - Math.pow(1 - rev, 3);
        var dy = Math.round((1 - e) * 60);
        var u = 3;
        var destaque = (this.hover === i) || (this.hover < 0 && this.foco === i);
        if (destaque) dy -= u * 3;
        if (this.pressionado === i) dy += u * 2;
        var alfa = e;
        var brilho = 0;
        var dx = 0;
        var ex = 0;
        if (this.escolhida >= 0) {
          if (i === this.escolhida) {
            var p = limitar(this.tEscolha / 0.35, 0, 1);
            dy -= Math.round(Math.sin(p * Math.PI) * 14);
            brilho = Math.max(0, 0.45 * (1 - this.tEscolha / 0.45));
            ex = Math.round(p * 6);
            alfa = 1 - limitar((this.tEscolha - 0.45) / 0.25, 0, 1);
          } else {
            alfa = Math.max(0, e * (1 - this.tEscolha / 0.3) * 0.4);
          }
        } else if (destaque) {
          brilho = 0.07;
        }
        if (alfa <= 0) continue;
        desenharCarta(ctx, this.cartas[i], r.x + dx - ex, r.y + dy - ex, r.w + ex * 2, r.h + ex * 2, {
          modo: this.modo,
          t: this.t,
          alfa: alfa,
          brilho: brilho,
          numero: i + 1
        });
      }
      var tamDica = Math.max(10, Math.round(tamTitulo * 0.5));
      fonte(ctx, tamDica, false);
      if (this.escolhida >= 0 && this.resultado && this.resultado.mensagem) {
        texto(ctx, this.resultado.mensagem, W / 2, Math.round(H * 0.95), '#ffd23f', 'center');
      } else if (this.escolhida < 0) {
        texto(ctx, 'Toque ou clique em uma carta  |  Teclas 1 2 3', W / 2, Math.round(H * 0.95), '#7a7a94', 'center');
      }
      if (this.debugHitboxes) {
        var hb = this.hitboxes();
        ctx.strokeStyle = 'rgba(255,0,255,0.8)';
        for (i = 0; i < hb.length; i++) ctx.strokeRect(hb[i].x, hb[i].y, hb[i].w, hb[i].h);
      }
      ctx.restore();
    }
  }

  global.GameCards = {
    CARTAS: CARTAS,
    RARIDADES: RAR,
    TIPOS: TIPOS,
    Chaves: Chaves,
    Draft: Draft,
    sortear: sortear,
    instanciar: instanciar,
    executar: executar,
    desenharCarta: desenharCarta,
    desenharMatriz: desenharMatriz,
    matrizIcone: matrizIcone,
    paletaIcone: paletaIcone,
    icones: Object.keys(CONSTRUTORES_ICONE)
  };
})(window);
