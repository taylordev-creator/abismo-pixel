(function (global) {
  'use strict';

  var TILE = 32;
  var MARGEM = 20;
  var MUNDOS = 4;
  var SUBNIVEIS = 10;
  var NIVEL_FINAL = MUNDOS * SUBNIVEIS + 1;
  var TAU = Math.PI * 2;
  var CHAVE_SAVE = 'roguelike_pixel_progresso';

  function rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function escolher(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function limitar(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  function dist(ax, ay, bx, by) {
    var dx = ax - bx;
    var dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
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

  var BIOMAS = [
    {
      id: 'floresta',
      nome: 'Floresta Sombria',
      piso: 'grama',
      chao: ['#2f5d34', '#2a5230'],
      chaoFinal: ['#243d2c', '#1e3326'],
      parede: '#14261a',
      paredeClara: '#2a4a2c',
      fundo: '#08120a',
      detalhe: '#4a8a48',
      detalhe2: '#1d3a1f',
      neblina: '#0a2a10',
      obstaculo: ['#4a3a2a', '#6b5238', '#2f7a3a'],
      deco: 'arvore',
      particula: { tipo: 'folha', cor: '#7ac14a' },
      boss: 'rei_goblin',
      pool: [
        { id: 'goblin', peso: 6, minSub: 1 },
        { id: 'lobo', peso: 3, minSub: 2 },
        { id: 'goblin_arqueiro', peso: 3, minSub: 3 },
        { id: 'morcego', peso: 2, minSub: 6 }
      ]
    },
    {
      id: 'cripta',
      nome: 'Catacumbas Esquecidas',
      piso: 'pedra',
      chao: ['#4a4a58', '#42424f'],
      chaoFinal: ['#2e2a40', '#28243a'],
      parede: '#1a1a26',
      paredeClara: '#3a3a4e',
      fundo: '#07070d',
      detalhe: '#6a6a80',
      detalhe2: '#2a2a38',
      neblina: '#1a1030',
      obstaculo: ['#6a6a7a', '#8a8a9a', '#cfc9b0'],
      deco: 'lapide',
      particula: { tipo: 'cinza', cor: '#9a9ab0' },
      boss: 'lorde_esqueleto',
      pool: [
        { id: 'esqueleto', peso: 6, minSub: 1 },
        { id: 'morcego', peso: 3, minSub: 2 },
        { id: 'mago_osso', peso: 3, minSub: 3 },
        { id: 'fantasma', peso: 3, minSub: 5 }
      ]
    },
    {
      id: 'pantano',
      nome: 'Pântano Venenoso',
      piso: 'lama',
      chao: ['#3d5a2a', '#355024'],
      chaoFinal: ['#2a4a3a', '#244032'],
      parede: '#14241a',
      paredeClara: '#2a4a38',
      fundo: '#060d08',
      detalhe: '#6aa84f',
      detalhe2: '#1a3a30',
      neblina: '#2a4a10',
      obstaculo: ['#3a2a1a', '#5a4a2a', '#8ad24a'],
      deco: 'cogumelo',
      particula: { tipo: 'bolha', cor: '#a6ff8a' },
      boss: 'rainha_aranha',
      pool: [
        { id: 'slime', peso: 6, minSub: 1 },
        { id: 'aranha', peso: 4, minSub: 2 },
        { id: 'sapo', peso: 3, minSub: 3 },
        { id: 'fantasma', peso: 2, minSub: 7 }
      ]
    },
    {
      id: 'vulcao',
      nome: 'Caverna Vulcânica',
      piso: 'lava',
      chao: ['#3a2a2a', '#322424'],
      chaoFinal: ['#4a1a14', '#3e1410'],
      parede: '#1a0e0e',
      paredeClara: '#4a2a22',
      fundo: '#0d0505',
      detalhe: '#ff7a1a',
      detalhe2: '#ffd23f',
      neblina: '#4a1000',
      obstaculo: ['#2a1e1e', '#4a3a3a', '#ff5a1a'],
      deco: 'rocha_lava',
      particula: { tipo: 'brasa', cor: '#ff9a3a' },
      boss: 'senhor_chamas',
      pool: [
        { id: 'demonio', peso: 5, minSub: 1 },
        { id: 'elemental_fogo', peso: 4, minSub: 2 },
        { id: 'golem_lava', peso: 3, minSub: 3 },
        { id: 'esqueleto', peso: 2, minSub: 6 }
      ]
    },
    {
      id: 'vazio',
      nome: 'Abismo do Vazio',
      piso: 'vazio',
      chao: ['#1a1033', '#150c2b'],
      chaoFinal: ['#0e0820', '#0a0618'],
      parede: '#08040f',
      paredeClara: '#3a1a6a',
      fundo: '#030106',
      detalhe: '#b05cff',
      detalhe2: '#5a2a9a',
      neblina: '#2a0a4a',
      obstaculo: ['#2a1a4a', '#5a2a9a', '#d9a6ff'],
      deco: 'cristal',
      particula: { tipo: 'estrela', cor: '#e0b3ff' },
      boss: 'devorador_vazio',
      pool: [
        { id: 'fantasma', peso: 4, minSub: 1 },
        { id: 'demonio', peso: 4, minSub: 1 },
        { id: 'mago_osso', peso: 3, minSub: 1 },
        { id: 'elemental_fogo', peso: 3, minSub: 1 },
        { id: 'golem_lava', peso: 2, minSub: 1 }
      ]
    }
  ];

  var SPRITES = {
    goblin: ['1.1111.1', '11111111', '11211211', '.111111.', '..1331..', '.444444.', '14444441', '.455554.', '.5....5.'],
    esqueleto: ['..1111..', '.111111.', '.121121.', '.111111.', '..1221..', '.111111.', '1.1221.1', '..1111..', '..1..1..', '..1..1..'],
    slime: ['..1111..', '.111111.', '11211211', '11111111', '11333311', '.111111.'],
    lobo: ['1.1..1.1', '11111111', '12111121', '11111111', '.113311.', '.111111.', '1.1111.1', '1......1'],
    morcego: ['1..11..1', '11111111', '11211211', '.111111.', '..1..1..'],
    fantasma: ['..1111..', '.111111.', '11211211', '11211211', '11133111', '11111111', '11111111', '11.11.11'],
    aranha: ['1.1..1.1', '.1.11.1.', '..1111..', '.121121.', '..1111..', '.1.11.1.', '1.1..1.1'],
    sapo: ['.1....1.', '121..121', '11111111', '11333311', '11111111', '1.1..1.1'],
    demonio: ['1......1', '11.11.11', '.111111.', '.121121.', '.111111.', '..1331..', '.111111.', '1.1111.1', '..1..1..'],
    golem_lava: ['.111111.', '11211211', '11111111', '13111131', '11333311', '11111111', '.11..11.', '.11..11.'],
    elemental_fogo: ['...11...', '..1111..', '.112211.', '.121121.', '11122111', '11111111', '.111111.', '..1..1..'],
    vazio: ['1....11....1', '11..1111..11', '111.1111.111', '.1111111111.', '112221122211', '111111111111', '113333333311', '113131313111', '.1111111111.', '..11.11.11..', '..1..11..1..']
  };

  var CATALOGO = {
    goblin: { nome: 'Goblin', sprite: 'goblin', paleta: { '1': '#6aa84f', '2': '#111111', '3': '#8a2a2a', '4': '#7a5230', '5': '#4a3220' }, hp: 18, dano: 4, vel: 48, ia: 'corpo', alcance: 6, cooldown: 1.0, pixel: 3, ouro: 3 },
    goblin_arqueiro: { nome: 'Goblin Arqueiro', sprite: 'goblin', paleta: { '1': '#8ab04f', '2': '#111111', '3': '#8a2a2a', '4': '#3a6a3a', '5': '#4a3220' }, hp: 12, dano: 4, vel: 40, ia: 'distancia', distPref: 150, cooldown: 1.8, projVel: 160, projTipo: 'flecha', projCor: '#d9c38a', pixel: 3, ouro: 4 },
    lobo: { nome: 'Lobo Sombrio', sprite: 'lobo', paleta: { '1': '#8a8a94', '2': '#ffd23f', '3': '#2a2a30' }, hp: 16, dano: 5, vel: 62, ia: 'investida', alcanceInvestida: 120, cooldown: 2.2, pixel: 3, ouro: 4 },
    esqueleto: { nome: 'Esqueleto', sprite: 'esqueleto', paleta: { '1': '#e8e4d0', '2': '#1a1a1a' }, hp: 24, dano: 5, vel: 42, ia: 'corpo', alcance: 6, cooldown: 1.1, pixel: 3, ouro: 4 },
    mago_osso: { nome: 'Mago Ósseo', sprite: 'esqueleto', paleta: { '1': '#cfc6e8', '2': '#7a2cff' }, hp: 16, dano: 6, vel: 36, ia: 'distancia', distPref: 160, cooldown: 2.2, projVel: 140, projTipo: 'magia', projCor: '#b05cff', pixel: 3, ouro: 6 },
    morcego: { nome: 'Morcego', sprite: 'morcego', paleta: { '1': '#5a3a6a', '2': '#ff4a4a' }, hp: 10, dano: 3, vel: 80, ia: 'voador', alcance: 4, cooldown: 0.8, pixel: 3, voa: true, ouro: 2 },
    fantasma: { nome: 'Fantasma', sprite: 'fantasma', paleta: { '1': '#c9e6ff', '2': '#1a2a4a', '3': '#1a2a4a' }, hp: 20, dano: 6, vel: 50, ia: 'voador', alcance: 4, cooldown: 1.2, pixel: 3, voa: true, fantasma: true, ouro: 6 },
    slime: { nome: 'Slime', sprite: 'slime', paleta: { '1': '#5ad05a', '2': '#0a3a0a', '3': '#2a8a2a' }, hp: 30, dano: 4, vel: 30, ia: 'corpo', alcance: 4, cooldown: 1.2, pixel: 3, divide: 'slime_mini', ouro: 4 },
    slime_mini: { nome: 'Slime Pequeno', sprite: 'slime', paleta: { '1': '#7ae07a', '2': '#0a3a0a', '3': '#3a9a3a' }, hp: 8, dano: 2, vel: 44, ia: 'corpo', alcance: 3, cooldown: 1.0, pixel: 2, ouro: 1 },
    aranha: { nome: 'Aranha Gigante', sprite: 'aranha', paleta: { '1': '#3a2a3a', '2': '#ff3030' }, hp: 18, dano: 5, vel: 58, ia: 'investida', alcanceInvestida: 110, cooldown: 2.0, pixel: 3, ouro: 5 },
    sapo: { nome: 'Sapo Tóxico', sprite: 'sapo', paleta: { '1': '#7a9a3a', '2': '#ffe27a', '3': '#4a5a1a' }, hp: 20, dano: 5, vel: 38, ia: 'distancia', distPref: 130, cooldown: 2.0, projVel: 130, projTipo: 'magia', projCor: '#a6ff8a', pixel: 3, ouro: 5 },
    demonio: { nome: 'Demônio', sprite: 'demonio', paleta: { '1': '#c93a3a', '2': '#ffe27a', '3': '#2a0a0a' }, hp: 34, dano: 8, vel: 50, ia: 'corpo', alcance: 7, cooldown: 1.1, pixel: 3, ouro: 7 },
    golem_lava: { nome: 'Golem de Lava', sprite: 'golem_lava', paleta: { '1': '#4a3a3a', '2': '#ff7a1a', '3': '#ff4a00' }, hp: 70, dano: 12, vel: 28, ia: 'corpo', alcance: 8, cooldown: 1.6, pixel: 4, resistenciaEmpurrao: 0.7, ouro: 10 },
    elemental_fogo: { nome: 'Elemental de Fogo', sprite: 'elemental_fogo', paleta: { '1': '#ff7a1a', '2': '#fff3a0' }, hp: 24, dano: 9, vel: 45, ia: 'distancia', distPref: 150, cooldown: 1.6, projVel: 150, projTipo: 'magia', projCor: '#ff7a1a', pixel: 3, voa: true, ouro: 8 }
  };

  var BOSSES = {
    rei_goblin: {
      nome: 'Rei Goblin', chefe: true, sprite: 'goblin',
      paleta: { '1': '#4a8a2f', '2': '#ffe27a', '3': '#8a2a2a', '4': '#b01e1e', '5': '#5a3a1a' },
      hp: 420, dano: 12, vel: 52, pixel: 6, alcance: 10, cooldown: 1.0, ouro: 120,
      ataques: ['investida', 'invocar', 'area'], invocar: 'goblin', coroa: true, aura: '#ffd23f',
      resistenciaEmpurrao: 0.9, limiares: [0.66, 0.33], cooldownAtaque: 2.6, raioArea: 90,
      tele: { investida: 0.6, invocar: 0.7, area: 0.9 }
    },
    lorde_esqueleto: {
      nome: 'Lorde Esqueleto', chefe: true, sprite: 'esqueleto',
      paleta: { '1': '#cfc6e8', '2': '#7a2cff' },
      hp: 520, dano: 14, vel: 50, pixel: 6, alcance: 10, cooldown: 1.0, ouro: 160,
      ataques: ['radial', 'invocar', 'area', 'investida'], invocar: 'esqueleto', coroa: true, aura: '#b05cff',
      resistenciaEmpurrao: 0.9, limiares: [0.66, 0.33], cooldownAtaque: 2.4, raioArea: 100,
      tele: { radial: 0.7, invocar: 0.7, area: 0.9, investida: 0.6 }
    },
    rainha_aranha: {
      nome: 'Rainha Aracnídea', chefe: true, sprite: 'aranha',
      paleta: { '1': '#2a1a3a', '2': '#6bff4a' },
      hp: 640, dano: 16, vel: 62, pixel: 7, alcance: 10, cooldown: 0.9, ouro: 200,
      ataques: ['investida', 'radial', 'invocar', 'area'], invocar: 'aranha', aura: '#6bff4a',
      resistenciaEmpurrao: 0.9, limiares: [0.66, 0.33], cooldownAtaque: 2.2, raioArea: 100,
      tele: { investida: 0.5, radial: 0.6, invocar: 0.7, area: 0.8 }
    },
    senhor_chamas: {
      nome: 'Senhor das Chamas', chefe: true, sprite: 'demonio',
      paleta: { '1': '#ff4a1a', '2': '#fff3a0', '3': '#2a0a0a' },
      hp: 800, dano: 20, vel: 56, pixel: 7, alcance: 12, cooldown: 0.9, ouro: 260,
      ataques: ['radial', 'area', 'investida', 'invocar', 'chuva'], ataquesFase: { chuva: 2 }, invocar: 'elemental_fogo', coroa: true, aura: '#ff7a1a',
      resistenciaEmpurrao: 0.95, limiares: [0.66, 0.33], cooldownAtaque: 2.0, raioArea: 110,
      tele: { radial: 0.6, area: 0.8, investida: 0.5, invocar: 0.7, chuva: 0.9 }
    },
    devorador_vazio: {
      nome: 'Devorador de Mundos', chefe: true, final: true, fixo: true, sprite: 'vazio',
      paleta: { '1': '#2a1a4a', '2': '#ff3a6a', '3': '#e0b3ff' },
      hp: 20000, dano: 32, vel: 54, pixel: 6, alcance: 14, cooldown: 0.8, reducao: 0.25, ouro: 2000,
      ataques: ['radial', 'area', 'investida', 'invocar', 'espiral', 'chuva'], ataquesFase: { espiral: 2, chuva: 2 },
      invocar: ['fantasma', 'demonio', 'mago_osso', 'golem_lava', 'elemental_fogo'], coroa: true, aura: '#b05cff',
      resistenciaEmpurrao: 1, limiares: [0.75, 0.5, 0.25], cooldownAtaque: 1.5, raioArea: 130,
      tele: { radial: 0.5, area: 0.7, investida: 0.45, invocar: 0.6, espiral: 0.6, chuva: 0.8 }
    }
  };

  function escalaVida(n) {
    return 1 + 0.22 * (n - 1) + 0.004 * (n - 1) * (n - 1);
  }

  function escalaDano(n) {
    return 1 + 0.10 * (n - 1) + 0.0015 * (n - 1) * (n - 1);
  }

  function desenharLinhas(ctx, linhas, paleta, x, y, p, override) {
    for (var j = 0; j < linhas.length; j++) {
      var l = linhas[j];
      for (var i = 0; i < l.length; i++) {
        var ch = l.charAt(i);
        if (ch === '.') continue;
        var cor = override || paleta[ch];
        if (!cor) continue;
        ctx.fillStyle = cor;
        ctx.fillRect(Math.round(x + i * p), Math.round(y + j * p), p, p);
      }
    }
  }

  class ProjetilHostil {
    constructor(o) {
      this.x = o.x;
      this.y = o.y;
      this.ang = o.ang;
      this.vel = o.vel || 140;
      this.dano = o.dano;
      this.raio = o.raio || 4;
      this.alcance = o.alcance || 480;
      this.cor = o.cor || '#ff4040';
      this.tipo = o.tipo || 'magia';
      this.dono = o.dono || null;
      this.percorrido = 0;
      this.morto = false;
      this.tempo = 0;
    }

    update(dt, arena) {
      if (this.morto) return;
      this.tempo += dt;
      var passo = this.vel * dt;
      this.x += Math.cos(this.ang) * passo;
      this.y += Math.sin(this.ang) * passo;
      this.percorrido += passo;
      var l = arena.limites;
      if (this.percorrido >= this.alcance || this.x < l.x - 20 || this.x > l.x + l.w + 20 || this.y < l.y - 20 || this.y > l.y + l.h + 20) {
        this.morto = true;
        return;
      }
      if (arena.colide(this.x, this.y, 2)) {
        this.morto = true;
        return;
      }
      var alvos = arena.alvos();
      for (var i = 0; i < alvos.length; i++) {
        var a = alvos[i];
        var c = a.centro();
        if (dist(this.x, this.y, c.x, c.y) <= this.raio + a.raio * 0.8) {
          arena.ferir(a, this.dano, this.dono);
          this.morto = true;
          break;
        }
      }
    }

    draw(ctx) {
      var x = Math.round(this.x);
      var y = Math.round(this.y);
      ctx.save();
      if (this.tipo === 'flecha') {
        var c = Math.cos(this.ang);
        var s = Math.sin(this.ang);
        for (var k = 0; k < 4; k++) {
          ctx.fillStyle = k === 0 ? '#ffffff' : (k === 3 ? '#6b4a2a' : this.cor);
          ctx.fillRect(Math.round(this.x - c * k * 3) - 1, Math.round(this.y - s * k * 3) - 1, 3, 3);
        }
      } else {
        var pulso = 1 + Math.sin(this.tempo * 18) * 0.2;
        var r = Math.round(5 * pulso);
        ctx.fillStyle = this.cor;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x - r - 2, y - r - 2, (r + 2) * 2, (r + 2) * 2);
        ctx.globalAlpha = 1;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
      ctx.restore();
    }
  }

  class Criatura {
    constructor(id, def, nivel, x, y, arena, opcoes) {
      opcoes = opcoes || {};
      this.id = id;
      this.def = def;
      this.arena = arena;
      this.nivel = nivel;
      this.nome = def.nome;
      this.chefe = !!def.chefe;
      this.elite = !!opcoes.elite && !this.chefe;
      this.contaMeta = opcoes.contaMeta !== false;
      var hpM;
      var dmM;
      if (def.fixo) {
        hpM = 1;
        dmM = 1;
      } else if (this.chefe) {
        hpM = 1 + 0.12 * (nivel - 1);
        dmM = 1 + 0.06 * (nivel - 1);
      } else {
        hpM = escalaVida(nivel);
        dmM = escalaDano(nivel);
      }
      if (this.elite) {
        hpM *= 2.2;
        dmM *= 1.4;
      }
      this.hpMax = Math.max(1, Math.round(def.hp * hpM));
      this.hp = this.hpMax;
      this.dano = Math.max(1, Math.round(def.dano * dmM));
      this.vel = def.vel * Math.min(1.25, 1 + 0.004 * (nivel - 1)) * (this.elite ? 1.1 : 1);
      this.pixel = (def.pixel || 3) + (this.elite ? 1 : 0);
      this.linhas = SPRITES[def.sprite];
      this.w = this.linhas[0].length * this.pixel;
      this.h = this.linhas.length * this.pixel;
      this.raio = Math.max(this.w, this.h) * 0.38;
      this.x = x;
      this.y = y;
      this.px = x;
      this.py = y;
      this.reducao = def.reducao || 0;
      this.ouro = Math.round((def.ouro || 1) * (1 + 0.15 * (nivel - 1)) * (this.elite ? 3 : 1));
      this.direcao = 1;
      this.estado = 'perseguir';
      this.estadoT = 0;
      this.cd = rnd(0.2, 0.8);
      this.cdContato = 0;
      this.flash = 0;
      this.golpeT = 0;
      this.tempo = rnd(0, 10);
      this.movendo = false;
      this.morto = false;
      this.dirX = 0;
      this.dirY = 0;
      this.acertou = false;
      this.fase = 1;
      this.ataque = null;
      this.ultimoAtaque = null;
      this.teleDur = 0.6;
      this.durExec = 0;
      this.inativoT = opcoes.inativoT || 0;
      this.anguloEsp = 0;
      this.relEsp = 0;
    }

    centro() {
      return { x: this.x, y: this.y - this.h / 2 };
    }

    mudar(estado) {
      this.estado = estado;
      this.estadoT = 0;
    }

    receberDano(dano, origem) {
      if (this.morto) return 0;
      var real = Math.max(1, Math.round(dano * (1 - this.reducao)));
      this.hp -= real;
      this.flash = 0.1;
      if (this.arena) this.arena.popup(this.x, this.y - this.h - 4, String(real), '#ffffff');
      if (this.hp <= 0) {
        this.hp = 0;
        this.morrer(origem);
      }
      return real;
    }

    takeDamage(dano, origem) {
      return this.receberDano(dano, origem);
    }

    morrer(origem) {
      if (this.morto) return;
      this.morto = true;
      if (this.arena) this.arena.aoMorteCriatura(this, origem);
    }

    ir(dx, dy, vel, dt) {
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var mx = dx / d * vel * dt;
      var my = dy / d * vel * dt;
      var a = this.arena;
      this.movendo = true;
      if (Math.abs(mx) > 0.01) this.direcao = mx > 0 ? 1 : -1;
      if (this.def.voa) {
        this.x += mx;
        this.y += my;
      } else {
        var r = this.raio * 0.7;
        if (!a.colide(this.x + mx, this.y, r)) this.x += mx;
        if (!a.colide(this.x, this.y + my, r)) this.y += my;
      }
      a.limitar(this);
    }

    update(dt, arena) {
      if (this.morto) return;
      this.tempo += dt;
      this.estadoT += dt;
      this.cd = Math.max(0, this.cd - dt);
      this.cdContato = Math.max(0, this.cdContato - dt);
      this.flash = Math.max(0, this.flash - dt);
      this.golpeT = Math.max(0, this.golpeT - dt);
      this.movendo = false;
      var res = this.def.resistenciaEmpurrao || 0;
      if (res > 0) {
        this.x = this.px + (this.x - this.px) * (1 - res);
        this.y = this.py + (this.y - this.py) * (1 - res);
      }
      if (this.inativoT > 0) {
        this.inativoT -= dt;
      } else if (this.chefe) {
        this.atualizarChefe(dt);
      } else {
        this.atualizarComum(dt);
      }
      arena.limitar(this);
      this.px = this.x;
      this.py = this.y;
    }

    atualizarComum(dt) {
      var arena = this.arena;
      var alvo = arena.alvoPara(this);
      if (!alvo) return;
      var c = this.centro();
      var ac = alvo.centro();
      var d = dist(c.x, c.y, ac.x, ac.y);
      var ia = this.def.ia;
      var dx = ac.x - c.x;
      var dy = ac.y - c.y;

      if (ia === 'corpo' || ia === 'voador') {
        var alc = this.def.alcance + this.raio + alvo.raio * 0.6;
        if (d > alc) {
          if (ia === 'voador') {
            var desvio = Math.sin(this.tempo * 3) * 0.8;
            var cs = Math.cos(desvio);
            var sn = Math.sin(desvio);
            this.ir(dx * cs - dy * sn, dx * sn + dy * cs, this.vel, dt);
          } else {
            this.ir(dx, dy, this.vel, dt);
          }
        } else if (this.cd <= 0) {
          this.golpeT = 0.2;
          this.cd = this.def.cooldown;
          arena.ferir(alvo, this.dano, this);
        }
      } else if (ia === 'distancia') {
        var pref = this.def.distPref;
        if (d < pref * 0.7) {
          this.ir(-dx, -dy, this.vel * 0.9, dt);
        } else if (d > pref * 1.1) {
          this.ir(dx, dy, this.vel, dt);
        } else {
          this.ir(-dy, dx, this.vel * 0.4, dt);
        }
        if (this.cd <= 0 && d < pref * 1.7) {
          this.cd = this.def.cooldown * rnd(0.9, 1.15);
          this.golpeT = 0.15;
          arena.projeteisHostis.push(new ProjetilHostil({
            x: c.x,
            y: c.y,
            ang: Math.atan2(dy, dx),
            vel: this.def.projVel,
            dano: Math.max(1, Math.round(this.dano * 0.9)),
            cor: this.def.projCor,
            tipo: this.def.projTipo,
            dono: this
          }));
        }
      } else if (ia === 'investida') {
        if (this.estado === 'perseguir') {
          this.ir(dx, dy, this.vel, dt);
          if (d < this.def.alcanceInvestida && this.cd <= 0) {
            var dd = d || 1;
            this.dirX = dx / dd;
            this.dirY = dy / dd;
            this.acertou = false;
            this.mudar('telegrafar');
          }
        } else if (this.estado === 'telegrafar') {
          if (this.estadoT >= 0.45) this.mudar('executar');
        } else if (this.estado === 'executar') {
          this.ir(this.dirX, this.dirY, this.vel * 4.2, dt);
          if (!this.acertou && d <= this.raio + alvo.raio) {
            this.acertou = true;
            arena.ferir(alvo, this.dano, this);
          }
          if (this.estadoT >= 0.3) this.mudar('recuperar');
        } else if (this.estado === 'recuperar') {
          if (this.estadoT >= 0.7) {
            this.cd = this.def.cooldown;
            this.mudar('perseguir');
          }
        }
      }
    }

    escolherAtaque() {
      var def = this.def;
      var fase = this.fase;
      var lista = def.ataques.filter(function (a) {
        var min = (def.ataquesFase && def.ataquesFase[a]) || 1;
        return fase >= min;
      });
      if (lista.length > 1 && this.ultimoAtaque) {
        lista = lista.filter(function (a) { return a !== this.ultimoAtaque; }, this);
      }
      return escolher(lista);
    }

    atualizarChefe(dt) {
      var arena = this.arena;
      var alvo = arena.alvoPara(this);
      if (!alvo) return;
      var def = this.def;
      var ratio = this.hp / this.hpMax;
      var nf = 1;
      for (var i = 0; i < def.limiares.length; i++) {
        if (ratio < def.limiares[i]) nf++;
      }
      if (nf > this.fase) {
        this.fase = nf;
        this.flash = 0.4;
        this.cd = 0.4;
        arena.tremer(0.5, 6);
        arena.banner(def.nome, 'FASE ' + nf, 1.6);
        arena.explodir(this.x, this.y - this.h / 2, def.aura || '#ffffff', 24);
        this.mudar('perseguir');
      }
      var c = this.centro();
      var ac = alvo.centro();
      var dx = ac.x - c.x;
      var dy = ac.y - c.y;
      var d = dist(c.x, c.y, ac.x, ac.y);
      var velFase = this.vel * (1 + 0.12 * (this.fase - 1));

      if (this.estado === 'perseguir') {
        var alc = def.alcance + this.raio + alvo.raio * 0.6;
        if (d > alc) this.ir(dx, dy, velFase, dt);
        if (d <= alc && this.cdContato <= 0) {
          this.cdContato = 0.9;
          this.golpeT = 0.25;
          arena.ferir(alvo, Math.round(this.dano * 0.7), this);
        }
        if (this.cd <= 0) this.iniciarAtaque(this.escolherAtaque(), alvo);
      } else if (this.estado === 'telegrafar') {
        if (this.estadoT >= this.teleDur) this.executarAtaque(this.ataque, alvo);
      } else if (this.estado === 'executar') {
        if (this.ataque === 'investida') {
          this.ir(this.dirX, this.dirY, velFase * 3.6, dt);
          if (!this.acertou && d <= this.raio + alvo.raio) {
            this.acertou = true;
            arena.ferir(alvo, Math.round(this.dano * 1.1), this);
          }
        } else if (this.ataque === 'espiral') {
          this.relEsp += dt;
          while (this.relEsp >= 0.09) {
            this.relEsp -= 0.09;
            this.anguloEsp += 0.32;
            this.dispararAng(this.anguloEsp);
            this.dispararAng(this.anguloEsp + Math.PI);
          }
        }
        if (this.estadoT >= this.durExec) this.mudar('recuperar');
      } else if (this.estado === 'recuperar') {
        if (this.estadoT >= 0.8 / (1 + 0.1 * (this.fase - 1))) {
          this.cd = def.cooldownAtaque / (1 + 0.25 * (this.fase - 1));
          this.mudar('perseguir');
        }
      }
    }

    iniciarAtaque(nome, alvo) {
      var def = this.def;
      var c = this.centro();
      var f = this.fase;
      this.ataque = nome;
      this.ultimoAtaque = nome;
      this.teleDur = (def.tele && def.tele[nome]) || 0.7;
      this.acertou = false;
      if (nome === 'area') {
        this.arena.criarZona({ x: this.x, y: this.y, r: (def.raioArea || 90) + f * 12, dur: this.teleDur, dano: this.dano * 1.2, cor: '#ff4040', origem: this });
      } else if (nome === 'chuva') {
        var n = 4 + f * 2;
        for (var i = 0; i < n; i++) {
          this.arena.criarZona({ x: alvo.x + rnd(-120, 120), y: alvo.y + rnd(-90, 90), r: 38, dur: this.teleDur + i * 0.12, dano: this.dano, cor: '#ff7a1a', origem: this });
        }
      } else if (nome === 'investida') {
        var ac = alvo.centro();
        var dx = ac.x - c.x;
        var dy = ac.y - c.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        this.dirX = dx / d;
        this.dirY = dy / d;
      }
      this.mudar('telegrafar');
    }

    executarAtaque(nome) {
      var f = this.fase;
      var final = !!this.def.final;
      if (nome === 'radial') {
        var n = final ? 12 + f * 6 : 8 + f * 4;
        var off = rnd(0, TAU);
        for (var i = 0; i < n; i++) this.dispararAng(off + (i / n) * TAU);
        this.mudar('recuperar');
      } else if (nome === 'area' || nome === 'chuva') {
        this.mudar('recuperar');
      } else if (nome === 'invocar') {
        this.invocar();
        this.mudar('recuperar');
      } else if (nome === 'investida') {
        this.durExec = 0.5;
        this.mudar('executar');
      } else if (nome === 'espiral') {
        this.durExec = 2.2;
        this.anguloEsp = rnd(0, TAU);
        this.relEsp = 0;
        this.mudar('executar');
      }
    }

    dispararAng(ang) {
      var c = this.centro();
      this.arena.projeteisHostis.push(new ProjetilHostil({
        x: c.x,
        y: c.y,
        ang: ang,
        vel: 120 + 10 * this.fase,
        dano: Math.max(1, Math.round(this.dano * 0.6)),
        cor: this.def.aura || '#ff4040',
        tipo: 'magia',
        alcance: 560,
        dono: this
      }));
    }

    invocar() {
      var def = this.def;
      var n = (def.final ? 3 : 2) + this.fase;
      for (var i = 0; i < n; i++) {
        if (this.arena.contarSubordinados() >= 10) break;
        var id = Array.isArray(def.invocar) ? escolher(def.invocar) : def.invocar;
        var a = rnd(0, TAU);
        var px = this.x + Math.cos(a) * (this.w * 0.7 + 20);
        var py = this.y + Math.sin(a) * (this.h * 0.4 + 10);
        var c = this.arena.spawnarCriatura(id, px, py, { contaMeta: false, nivel: Math.max(1, this.nivel - 2) });
        this.arena.limitar(c);
        this.arena.explodir(c.x, c.y - c.h / 2, def.aura || '#ffffff', 8);
      }
    }

    desenharTelegrafo(ctx) {
      var investida = this.estado === 'telegrafar' && (this.ataque === 'investida' || this.def.ia === 'investida') && (this.chefe || this.def.ia === 'investida');
      if (!investida) return;
      var c = this.centro();
      var comp = this.chefe ? 160 : 90;
      ctx.save();
      ctx.fillStyle = 'rgba(255,60,60,0.7)';
      for (var k = 1; k <= 8; k++) {
        ctx.fillRect(Math.round(c.x + this.dirX * comp * k / 8) - 2, Math.round(c.y + this.dirY * comp * k / 8) - 2, 4, 4);
      }
      ctx.restore();
    }

    draw(ctx) {
      if (this.morto) return;
      var p = this.pixel;
      var def = this.def;
      var alt = def.voa ? p * 2.5 + Math.sin(this.tempo * 3) * p * 0.6 : 0;
      var bob = this.movendo ? Math.sin(this.tempo * 10) * p * 0.4 : 0;
      var lunge = this.golpeT > 0 ? p * 0.8 : 0;
      var sx = this.x - this.w / 2;
      var sy = this.y - this.h - alt + bob - lunge;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(Math.round(this.x - this.w * 0.4), Math.round(this.y - p * 0.5), Math.round(this.w * 0.8), p);
      if (this.chefe && def.aura) {
        ctx.fillStyle = rgba(def.aura, 0.15 + 0.08 * Math.sin(this.tempo * 4));
        ctx.fillRect(Math.round(sx - p * 2), Math.round(sy - p * 2), this.w + p * 4, this.h + p * 4);
      }
      if (this.elite) {
        ctx.fillStyle = rgba('#ffd23f', 0.35);
        ctx.fillRect(Math.round(sx - p), Math.round(sy - p), this.w + p * 2, this.h + p * 2);
      }
      if (def.fantasma) ctx.globalAlpha = 0.65 + 0.2 * Math.sin(this.tempo * 4);
      var override = null;
      if (this.flash > 0) {
        override = '#ffffff';
      } else if (this.estado === 'telegrafar' && Math.floor(this.tempo * 14) % 2 === 0) {
        override = '#ff5050';
      }
      desenharLinhas(ctx, this.linhas, def.paleta, sx, sy, p, override);
      ctx.globalAlpha = 1;
      if (def.coroa) {
        var cx = this.x;
        var cy = sy - p * 2;
        ret(ctx, '#ffd23f', cx - p * 2, cy + p, p * 4, p);
        ret(ctx, '#ffd23f', cx - p * 2, cy, p, p);
        ret(ctx, '#ffd23f', cx - p * 0.5, cy - p * 0.5, p, p * 1.5);
        ret(ctx, '#ffd23f', cx + p, cy, p, p);
      }
      ctx.restore();
      this.desenharTelegrafo(ctx);
      if (!this.chefe && this.hp < this.hpMax) {
        var bw = Math.max(16, this.w);
        var bx = Math.round(this.x - bw / 2);
        var by = Math.round(sy - 8);
        ret(ctx, '#14141c', bx - 1, by - 1, bw + 2, 5);
        ret(ctx, this.elite ? '#ffd23f' : '#e04040', bx, by, bw * (this.hp / this.hpMax), 3);
      }
    }
  }

  var FabricaCriaturas = {
    escalaVida: escalaVida,
    escalaDano: escalaDano,

    definicao: function (id) {
      return CATALOGO[id] || BOSSES[id] || null;
    },

    criar: function (id, nivel, x, y, arena, opcoes) {
      var def = this.definicao(id);
      if (!def) throw new Error('Criatura desconhecida: ' + id);
      return new Criatura(id, def, Math.max(1, nivel), x, y, arena, opcoes);
    },

    sortear: function (bioma, sub) {
      var lista = bioma.pool.filter(function (e) { return e.minSub <= sub; });
      var total = 0;
      var i;
      for (i = 0; i < lista.length; i++) total += lista[i].peso;
      var r = Math.random() * total;
      for (i = 0; i < lista.length; i++) {
        r -= lista[i].peso;
        if (r <= 0) return lista[i].id;
      }
      return lista[0].id;
    }
  };

  class Ameaca {
    constructor(o) {
      o = o || {};
      this.valor = 0;
      this.tempo = 0;
      this.ondas = 0;
      this.relogio = 0;
      this.crescimento = o.crescimento || 1.2;
      this.intervaloBase = o.intervaloBase || 2.6;
      this.intervaloMin = o.intervaloMin || 0.3;
      this.capBase = o.capBase || 6;
      this.capMax = o.capMax || 28;
      this.capFator = o.capFator || 1;
      this.tamanhoOnda = o.tamanhoOnda || 4;
    }

    get taxa() {
      return 1 / this.intervalo();
    }

    intervalo() {
      return Math.max(this.intervaloMin, this.intervaloBase / (1 + this.valor / 35 + this.tempo / 50 + this.ondas * 0.35));
    }

    capacidade(sub) {
      var bruto = this.capBase + Math.floor(this.valor / 14) + Math.floor(this.tempo / 30) + sub;
      return Math.max(2, Math.floor(Math.min(this.capMax, bruto) * this.capFator));
    }

    update(dt) {
      this.tempo += dt;
      this.valor += this.crescimento * (1 + this.tempo / 90) * dt;
      var onda = false;
      if (this.valor >= 100) {
        this.valor = 40;
        this.ondas++;
        onda = true;
      }
      this.relogio += dt;
      var spawns = 0;
      var iv = this.intervalo();
      while (this.relogio >= iv && spawns < 6) {
        this.relogio -= iv;
        spawns++;
      }
      return { spawns: spawns, onda: onda, extra: onda ? this.tamanhoOnda + this.ondas * 2 : 0 };
    }

    desenhar(ctx, x, y, w, h) {
      var r = limitar(this.valor / 100, 0, 1);
      var cor = r < 0.5 ? misturar('#4cd04c', '#e0c030', r * 2) : misturar('#e0c030', '#e03030', (r - 0.5) * 2);
      ctx.save();
      ret(ctx, '#0a0a10', x - 2, y - 2, w + 4, h + 4);
      ret(ctx, '#2a2a38', x, y, w, h);
      ret(ctx, cor, x, y, w * r, h);
      if (this.ondas > 0 || r > 0.85) {
        ctx.fillStyle = (Math.floor(this.tempo * 6) % 2 === 0 && r > 0.85) ? '#ff6060' : '#ffffff';
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('AMEAÇA  x' + (this.taxa).toFixed(1) + '/s  ONDA ' + this.ondas, x, y - 5);
      ctx.restore();
    }
  }

  function detalhesTile(g, bioma, x, y, rng, base) {
    var i;
    var px;
    var py;
    if (bioma.piso === 'grama') {
      for (i = 0; i < 4; i++) {
        px = x + Math.floor(rng() * 30) + 1;
        py = y + Math.floor(rng() * 26) + 1;
        ret(g, rng() < 0.5 ? bioma.detalhe : bioma.detalhe2, px, py, 2, 4);
      }
      if (rng() < 0.05) ret(g, rng() < 0.5 ? '#e8d84a' : '#d85a8a', x + Math.floor(rng() * 28) + 2, y + Math.floor(rng() * 28) + 2, 3, 3);
    } else if (bioma.piso === 'pedra') {
      ret(g, ajustar(base, 0.8), x, y, TILE, 1);
      ret(g, ajustar(base, 0.8), x, y, 1, TILE);
      if (rng() < 0.25) {
        px = x + Math.floor(rng() * 20) + 4;
        py = y + Math.floor(rng() * 20) + 4;
        ret(g, bioma.detalhe2, px, py, 2, 2);
        ret(g, bioma.detalhe2, px + 2, py + 2, 2, 2);
        ret(g, bioma.detalhe2, px + 4, py + 2, 4, 1);
      }
      if (rng() < 0.05) ret(g, '#cfc9b0', x + Math.floor(rng() * 24) + 3, y + Math.floor(rng() * 24) + 3, 5, 2);
    } else if (bioma.piso === 'lama') {
      if (rng() < 0.3) {
        px = x + Math.floor(rng() * 14) + 2;
        py = y + Math.floor(rng() * 20) + 4;
        var pw = 8 + Math.floor(rng() * 10);
        ret(g, bioma.detalhe2, px, py, pw, 5);
        ret(g, ajustar(bioma.detalhe2, 1.6), px + 1, py, pw - 2, 1);
      }
      if (rng() < 0.15) {
        px = x + Math.floor(rng() * 28) + 2;
        py = y + Math.floor(rng() * 20) + 2;
        ret(g, bioma.detalhe, px, py, 1, 6);
        ret(g, bioma.detalhe, px + 2, py + 2, 1, 4);
      }
    } else if (bioma.piso === 'lava') {
      if (rng() < 0.35) {
        px = x + Math.floor(rng() * 16) + 2;
        py = y + Math.floor(rng() * 20) + 4;
        ret(g, bioma.detalhe, px, py, 8, 2);
        ret(g, bioma.detalhe, px + 6, py + 2, 2, 5);
        ret(g, bioma.detalhe2, px + 1, py, 5, 1);
      }
      if (rng() < 0.2) ret(g, ajustar(base, 0.7), x + Math.floor(rng() * 28), y + Math.floor(rng() * 28), 3, 2);
    } else {
      if (rng() < 0.5) {
        var tam = rng() < 0.2 ? 2 : 1;
        ret(g, bioma.detalhe, x + Math.floor(rng() * 30), y + Math.floor(rng() * 30), tam, tam);
      }
      if (rng() < 0.04) {
        px = x + 8;
        py = y + 8;
        ret(g, bioma.detalhe2, px, py, 16, 1);
        ret(g, bioma.detalhe2, px, py + 15, 16, 1);
        ret(g, bioma.detalhe2, px, py, 1, 16);
        ret(g, bioma.detalhe2, px + 15, py, 1, 16);
      }
    }
  }

  function criarPiso(bioma, mundo, sub, largura, altura) {
    if (typeof document === 'undefined') return null;
    var cv = document.createElement('canvas');
    cv.width = largura;
    cv.height = altura;
    var g = cv.getContext('2d');
    if (!g) return null;
    var rng = mulberry32(mundo * 1000 + sub * 7 + 13);
    var t = (sub - 1) / (SUBNIVEIS - 1);
    var c1 = misturar(bioma.chao[0], bioma.chaoFinal[0], t);
    var c2 = misturar(bioma.chao[1], bioma.chaoFinal[1], t);
    var tx;
    var ty;
    for (ty = 0; ty * TILE < altura; ty++) {
      for (tx = 0; tx * TILE < largura; tx++) {
        var base = ((tx + ty) % 2) ? c2 : c1;
        var cor = ajustar(base, 0.94 + rng() * 0.12);
        ret(g, cor, tx * TILE, ty * TILE, TILE, TILE);
        detalhesTile(g, bioma, tx * TILE, ty * TILE, rng, cor);
      }
    }
    ret(g, bioma.parede, 0, 0, largura, MARGEM);
    ret(g, bioma.parede, 0, altura - MARGEM, largura, MARGEM);
    ret(g, bioma.parede, 0, 0, MARGEM, altura);
    ret(g, bioma.parede, largura - MARGEM, 0, MARGEM, altura);
    var i;
    for (i = 0; i < largura; i += 20) {
      ret(g, bioma.paredeClara, i, MARGEM - 3, 18, 2);
      ret(g, bioma.paredeClara, i + (i % 40 ? 6 : 0), altura - MARGEM + 1, 14, 2);
    }
    for (i = 0; i < altura; i += 20) {
      ret(g, bioma.paredeClara, MARGEM - 3, i, 2, 18);
      ret(g, bioma.paredeClara, largura - MARGEM + 1, i + (i % 40 ? 6 : 0), 2, 14);
    }
    return cv;
  }

  function desenharObstaculo(ctx, o, bioma) {
    var c = bioma.obstaculo;
    var r = o.r;
    var x = Math.round(o.x);
    var y = Math.round(o.y);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x - r, y - 4, r * 2, 6);
    if (bioma.deco === 'arvore') {
      ret(ctx, c[0], x - 4, y - r * 1.2, 8, r * 1.2);
      ret(ctx, ajustar(c[2], 0.75), x - r, y - r * 2, r * 2, r * 0.9);
      ret(ctx, c[2], x - r * 0.75, y - r * 2.7, r * 1.5, r * 0.9);
      ret(ctx, ajustar(c[2], 1.3), x - r * 0.4, y - r * 3.1, r * 0.8, r * 0.5);
    } else if (bioma.deco === 'lapide') {
      ret(ctx, c[0], x - r * 0.7, y - r * 1.6, r * 1.4, r * 1.6);
      ret(ctx, c[1], x - r * 0.5, y - r * 1.9, r, r * 0.4);
      ret(ctx, c[2], x - 1, y - r * 1.4, 3, r * 0.9);
      ret(ctx, c[2], x - r * 0.3, y - r * 1.1, r * 0.6, 3);
    } else if (bioma.deco === 'cogumelo') {
      ret(ctx, c[1], x - 4, y - r * 1.1, 8, r * 1.1);
      ret(ctx, c[0], x - r, y - r * 1.8, r * 2, r * 0.8);
      ret(ctx, c[2], x - r * 0.8, y - r * 2.2, r * 1.6, r * 0.6);
      ret(ctx, '#ffffff', x - r * 0.4, y - r * 2, 4, 4);
      ret(ctx, '#ffffff', x + r * 0.3, y - r * 1.8, 3, 3);
    } else if (bioma.deco === 'rocha_lava') {
      ret(ctx, c[0], x - r, y - r * 1.1, r * 2, r * 1.1);
      ret(ctx, c[1], x - r * 0.7, y - r * 1.7, r * 1.4, r * 0.7);
      ret(ctx, c[2], x - r * 0.4, y - r * 1.2, 3, r * 0.9);
      ret(ctx, c[2], x + r * 0.2, y - r * 0.8, r * 0.4, 3);
    } else {
      ret(ctx, c[0], x - r * 0.8, y - r * 0.6, r * 1.6, r * 0.6);
      ret(ctx, c[1], x - r * 0.4, y - r * 1.8, r * 0.8, r * 1.8);
      ret(ctx, c[2], x - r * 0.15, y - r * 2.2, r * 0.3, r * 1.6);
      ret(ctx, c[1], x + r * 0.4, y - r * 1.2, r * 0.4, r * 1.2);
    }
    ctx.restore();
  }

  class Arena {
    constructor(o) {
      this.campanha = o.campanha;
      this.mundo = o.mundo;
      this.sub = o.sub;
      this.jogador = o.jogador;
      this.largura = o.largura;
      this.altura = o.altura;
      this.bioma = BIOMAS[this.mundo - 1];
      this.ehFinal = this.mundo > MUNDOS;
      this.ehBoss = this.ehFinal || this.sub === SUBNIVEIS;
      this.nivel = this.ehFinal ? NIVEL_FINAL : (this.mundo - 1) * SUBNIVEIS + this.sub;
      this.meta = this.ehBoss ? 1 : 12 + 3 * (this.sub - 1) + 5 * (this.mundo - 1);
      this.abates = 0;
      this.tempo = 0;
      this.concluida = false;
      this.chefe = null;
      this.chefeDerrotado = false;
      this.limites = { x: MARGEM, y: MARGEM, w: this.largura - MARGEM * 2, h: this.altura - MARGEM * 2 + 14 };
      this.criaturas = [];
      this.projeteisHostis = [];
      this.projeteisJogador = [];
      this.zonas = [];
      this.drops = [];
      this.popups = [];
      this.particulas = [];
      this.obstaculos = [];
      this.tremor = { t: 0, mag: 0 };
      this.piso = criarPiso(this.bioma, this.mundo, this.sub, this.largura, this.altura);
      this.ameaca = new Ameaca({
        crescimento: 1.0 + 0.03 * this.nivel,
        intervaloBase: Math.max(1.4, 2.8 - 0.03 * this.nivel),
        capBase: 6,
        capMax: 30,
        capFator: this.ehBoss ? 0.45 : 1,
        tamanhoOnda: 4 + Math.floor(this.nivel / 6)
      });
      if (this.ehBoss) this.ameaca.crescimento *= 0.4;
      this.gerarObstaculos();
      this.posicionarJogador();
      if (this.ehBoss) this.iniciarChefe();
    }

    gerarObstaculos() {
      var rng = mulberry32(this.mundo * 977 + this.sub * 31 + 5);
      var alvo = 4 + Math.floor(rng() * 4);
      var l = this.limites;
      var tentativas = 0;
      var self = this;
      while (this.obstaculos.length < alvo && tentativas < 60) {
        tentativas++;
        var r = 16 + Math.floor(rng() * 9);
        var x = l.x + 60 + rng() * (l.w - 120);
        var y = l.y + 90 + rng() * (l.h - 150);
        if (dist(x, y, this.largura / 2, this.altura - 80) < 110) continue;
        if (this.ehBoss && dist(x, y, this.largura / 2, 110) < 120) continue;
        var ok = true;
        for (var i = 0; i < this.obstaculos.length; i++) {
          if (dist(x, y, this.obstaculos[i].x, this.obstaculos[i].y) < 70) ok = false;
        }
        if (!ok) continue;
        this.obstaculos.push({
          x: x,
          y: y,
          r: r,
          morto: false,
          draw: function (ctx) { desenharObstaculo(ctx, this, self.bioma); }
        });
      }
    }

    posicionarJogador() {
      var j = this.jogador;
      j.x = this.largura / 2;
      j.y = this.altura - 80;
      j.cdAtaque = 0;
      if (j.ajudantes) {
        for (var i = 0; i < j.ajudantes.membros.length; i++) {
          j.ajudantes.membros[i].x = j.x + (i - 1) * 30;
          j.ajudantes.membros[i].y = j.y + 14;
        }
      }
    }

    iniciarChefe() {
      var id = this.bioma.boss;
      var c = FabricaCriaturas.criar(id, this.nivel, this.largura / 2, 150, this, { contaMeta: false, inativoT: 1.8 });
      c.cd = 1.5;
      this.criaturas.push(c);
      this.chefe = c;
      this.banner('BOSS: ' + c.nome, this.bioma.nome, 2.4);
      if (this.campanha) this.campanha.emitir('boss_iniciado', { nome: c.nome, final: this.ehFinal });
    }

    contexto() {
      var self = this;
      return {
        inimigos: this.criaturas,
        projeteis: this.projeteisJogador,
        limites: this.limites,
        colide: function (x, y, r) { return self.colide(x, y, r); }
      };
    }

    banner(texto, sub, dur) {
      if (this.campanha) this.campanha.definirBanner(texto, sub, dur);
    }

    colide(x, y, r) {
      for (var i = 0; i < this.obstaculos.length; i++) {
        var o = this.obstaculos[i];
        if (dist(x, y, o.x, o.y) < o.r + (r || 0) * 0.6) return true;
      }
      return false;
    }

    limitar(e) {
      var l = this.limites;
      var r = e.raio * 0.5;
      e.x = limitar(e.x, l.x + r, l.x + l.w - r);
      e.y = limitar(e.y, l.y + e.h * 0.5, l.y + l.h);
    }

    alvos() {
      var lista = [];
      var j = this.jogador;
      if (j && !j.morto) lista.push(j);
      if (j && j.ajudantes) {
        for (var i = 0; i < j.ajudantes.membros.length; i++) {
          if (!j.ajudantes.membros[i].morto) lista.push(j.ajudantes.membros[i]);
        }
      }
      return lista;
    }

    alvoPara(c) {
      var lista = this.alvos();
      var melhor = null;
      var menor = Infinity;
      for (var i = 0; i < lista.length; i++) {
        var d = dist(c.x, c.y, lista[i].x, lista[i].y);
        if (d < menor) {
          menor = d;
          melhor = lista[i];
        }
      }
      return melhor;
    }

    ferir(alvo, dano, origem) {
      var real = alvo.receberDano(dano, origem);
      if (real > 0) {
        this.popup(alvo.x, alvo.y - 40, '-' + real, '#ff6060');
        if (alvo === this.jogador) this.tremer(0.15, 3);
      }
      return real;
    }

    tremer(t, mag) {
      this.tremor.t = Math.max(this.tremor.t, t);
      this.tremor.mag = Math.max(this.tremor.mag, mag);
    }

    popup(x, y, texto, cor) {
      if (this.popups.length > 40) this.popups.shift();
      this.popups.push({ x: x + rnd(-6, 6), y: y, texto: texto, cor: cor, t: 0, dur: 0.8 });
    }

    explodir(x, y, cor, n) {
      for (var i = 0; i < n; i++) {
        var a = rnd(0, TAU);
        var v = rnd(30, 110);
        this.particulas.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: rnd(0.3, 0.7), t: 0, cor: cor, tam: Math.random() < 0.5 ? 2 : 3, grav: 120 });
      }
    }

    criarZona(z) {
      z.t = 0;
      this.zonas.push(z);
    }

    contarVivos() {
      var n = 0;
      for (var i = 0; i < this.criaturas.length; i++) {
        if (!this.criaturas[i].morto && !this.criaturas[i].chefe) n++;
      }
      return n;
    }

    contarSubordinados() {
      return this.contarVivos();
    }

    spawnarCriatura(id, x, y, opc) {
      opc = opc || {};
      var c = FabricaCriaturas.criar(id, opc.nivel || this.nivel, x, y, this, opc);
      this.criaturas.push(c);
      return c;
    }

    posicaoSpawn() {
      var l = this.limites;
      var j = this.jogador;
      var x = 0;
      var y = 0;
      for (var t = 0; t < 8; t++) {
        var lado = Math.floor(Math.random() * 4);
        if (lado === 0) {
          x = rnd(l.x + 20, l.x + l.w - 20);
          y = l.y + 30;
        } else if (lado === 1) {
          x = rnd(l.x + 20, l.x + l.w - 20);
          y = l.y + l.h - 10;
        } else if (lado === 2) {
          x = l.x + 20;
          y = rnd(l.y + 40, l.y + l.h - 10);
        } else {
          x = l.x + l.w - 20;
          y = rnd(l.y + 40, l.y + l.h - 10);
        }
        if (dist(x, y, j.x, j.y) > 150 && !this.colide(x, y, 14)) break;
      }
      return { x: x, y: y };
    }

    spawnarDaAmeaca() {
      var id = FabricaCriaturas.sortear(this.bioma, this.ehFinal ? SUBNIVEIS : this.sub);
      var pos = this.posicaoSpawn();
      var elite = this.sub >= 3 && Math.random() < 0.03 + 0.004 * this.nivel;
      var c = this.spawnarCriatura(id, pos.x, pos.y, { elite: elite, nivel: this.nivel + (Math.random() < 0.25 ? 1 : 0) });
      this.explodir(c.x, c.y - c.h / 2, this.bioma.detalhe, 5);
      return c;
    }

    atualizarSpawns(dt) {
      var r = this.ameaca.update(dt);
      var cap = this.ameaca.capacidade(this.sub);
      var vivos = this.contarVivos();
      var i;
      for (i = 0; i < r.spawns && vivos < cap; i++) {
        this.spawnarDaAmeaca();
        vivos++;
      }
      if (r.onda) {
        this.banner('ONDA ' + this.ameaca.ondas, 'A ameaça aumenta!', 1.4);
        if (this.campanha) this.campanha.emitir('onda', { onda: this.ameaca.ondas });
        for (i = 0; i < r.extra && vivos < Math.floor(cap * 1.5); i++) {
          this.spawnarDaAmeaca();
          vivos++;
        }
      }
    }

    aoMorteCriatura(c, origem) {
      this.explodir(c.x, c.y - c.h / 2, c.def.paleta['1'], c.chefe ? 40 : 10);
      if (c.contaMeta) this.abates++;
      var n = c.chefe ? 6 : 1;
      for (var i = 0; i < n; i++) {
        this.drops.push({ tipo: 'ouro', valor: Math.max(1, Math.round(c.ouro / n)), x: c.x + rnd(-10, 10), y: c.y - c.h / 2 + rnd(-6, 6), t: rnd(0, 6) });
      }
      if (c.chefe || Math.random() < (c.elite ? 0.3 : 0.05)) {
        this.drops.push({ tipo: 'cura', valor: 0.2, x: c.x, y: c.y - c.h / 2, t: 0 });
      }
      if (c.def.divide && !this.concluida) {
        for (var k = 0; k < 2; k++) {
          this.spawnarCriatura(c.def.divide, c.x + (k ? 10 : -10), c.y, { contaMeta: false, nivel: c.nivel });
        }
      }
      if (c.chefe) {
        this.chefeDerrotado = true;
        this.tremer(0.8, 8);
        if (this.campanha) this.campanha.emitir('boss_derrotado', { nome: c.nome, final: this.ehFinal });
      }
    }

    concluir() {
      if (this.concluida) return;
      this.concluida = true;
      for (var i = 0; i < this.criaturas.length; i++) {
        var c = this.criaturas[i];
        if (!c.morto) {
          c.morto = true;
          this.explodir(c.x, c.y - c.h / 2, c.def.paleta['1'], 8);
        }
      }
      this.projeteisHostis.length = 0;
      this.zonas.length = 0;
      if (this.campanha) this.campanha.emitir('nivel_completo', { mundo: this.mundo, sub: this.sub });
    }

    atualizarAmbiente(dt) {
      var cfg = this.bioma.particula;
      var l = this.limites;
      var i;
      if (this.particulas.length < 45 && Math.random() < dt * 14) {
        var p = { x: rnd(l.x, l.x + l.w), y: rnd(l.y, l.y + l.h), vx: 0, vy: 0, vida: rnd(2, 5), t: 0, cor: cfg.cor, tam: 2, grav: 0 };
        if (cfg.tipo === 'folha') {
          p.y = l.y;
          p.vx = rnd(10, 30);
          p.vy = rnd(15, 35);
        } else if (cfg.tipo === 'cinza') {
          p.vx = rnd(-6, 6);
          p.vy = rnd(8, 18);
          p.tam = 1;
        } else if (cfg.tipo === 'bolha') {
          p.y = l.y + l.h;
          p.vx = rnd(-6, 6);
          p.vy = rnd(-30, -12);
          p.tam = 3;
        } else if (cfg.tipo === 'brasa') {
          p.y = l.y + l.h;
          p.vx = rnd(-14, 14);
          p.vy = rnd(-60, -25);
        } else {
          p.vx = rnd(-3, 3);
          p.vy = rnd(-3, 3);
          p.tam = Math.random() < 0.3 ? 2 : 1;
        }
        this.particulas.push(p);
      }
      for (i = this.particulas.length - 1; i >= 0; i--) {
        var q = this.particulas[i];
        q.t += dt;
        q.vy += (q.grav || 0) * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        if (q.t >= q.vida) this.particulas.splice(i, 1);
      }
      for (i = this.popups.length - 1; i >= 0; i--) {
        this.popups[i].t += dt;
        this.popups[i].y -= 22 * dt;
        if (this.popups[i].t >= this.popups[i].dur) this.popups.splice(i, 1);
      }
      this.tremor.t = Math.max(0, this.tremor.t - dt);
      if (this.tremor.t <= 0) this.tremor.mag = 0;
    }

    atualizarZonas(dt) {
      for (var i = this.zonas.length - 1; i >= 0; i--) {
        var z = this.zonas[i];
        z.t += dt;
        if (z.t < z.dur) continue;
        var alvos = this.alvos();
        for (var k = 0; k < alvos.length; k++) {
          if (dist(z.x, z.y, alvos[k].x, alvos[k].y) <= z.r + alvos[k].raio * 0.5) {
            this.ferir(alvos[k], Math.max(1, Math.round(z.dano)), z.origem);
          }
        }
        this.explodir(z.x, z.y, z.cor, 14);
        this.tremer(0.2, 3);
        this.zonas.splice(i, 1);
      }
    }

    coletarDrops(dt) {
      var j = this.jogador;
      if (!j || j.morto) return;
      for (var i = this.drops.length - 1; i >= 0; i--) {
        var d = this.drops[i];
        d.t += dt;
        var dd = dist(d.x, d.y, j.x, j.y - 20);
        if (dd < 90) {
          d.x += (j.x - d.x) / (dd || 1) * 150 * dt;
          d.y += ((j.y - 20) - d.y) / (dd || 1) * 150 * dt;
        }
        if (dd < 14) {
          if (d.tipo === 'ouro') {
            j.ouro = (j.ouro || 0) + d.valor;
            this.popup(j.x, j.y - 50, '+' + d.valor, '#ffd23f');
          } else {
            j.curar(Math.round(j.hpMax * d.valor));
            this.popup(j.x, j.y - 50, '+HP', '#6bff6b');
          }
          this.drops.splice(i, 1);
        }
      }
    }

    update(dt) {
      this.tempo += dt;
      this.atualizarAmbiente(dt);
      var ctx = this.contexto();
      var i;
      for (i = this.projeteisJogador.length - 1; i >= 0; i--) {
        this.projeteisJogador[i].update(dt, ctx);
        if (this.projeteisJogador[i].morto) this.projeteisJogador.splice(i, 1);
      }
      if (!this.concluida) {
        this.atualizarSpawns(dt);
        for (i = this.criaturas.length - 1; i >= 0; i--) {
          var c = this.criaturas[i];
          if (c && !c.morto) c.update(dt, this);
        }
        for (i = this.projeteisHostis.length - 1; i >= 0; i--) {
          this.projeteisHostis[i].update(dt, this);
          if (this.projeteisHostis[i].morto) this.projeteisHostis.splice(i, 1);
        }
        this.atualizarZonas(dt);
        if (this.ehBoss ? this.chefeDerrotado : this.abates >= this.meta) this.concluir();
      }
      this.coletarDrops(dt);
      for (i = this.criaturas.length - 1; i >= 0; i--) {
        if (this.criaturas[i].morto) this.criaturas.splice(i, 1);
      }
    }

    desenharZonas(ctx) {
      for (var i = 0; i < this.zonas.length; i++) {
        var z = this.zonas[i];
        var k = limitar(z.t / z.dur, 0, 1);
        ctx.save();
        ctx.fillStyle = rgba(z.cor, 0.12 + 0.25 * k);
        var n = Math.max(16, Math.round(z.r / 2.5));
        for (var j = 0; j < n; j++) {
          var a = (j / n) * TAU;
          ctx.fillRect(Math.round(z.x + Math.cos(a) * z.r - 2), Math.round(z.y + Math.sin(a) * z.r * 0.6 - 2), 4, 4);
        }
        ctx.fillStyle = rgba(z.cor, 0.08 + 0.3 * k);
        var rr = z.r * k;
        for (var m = 0; m < 18; m++) {
          var b = (m / 18) * TAU;
          ctx.fillRect(Math.round(z.x + Math.cos(b) * rr - 1.5), Math.round(z.y + Math.sin(b) * rr * 0.6 - 1.5), 3, 3);
        }
        ctx.restore();
      }
    }

    desenharDrops(ctx) {
      for (var i = 0; i < this.drops.length; i++) {
        var d = this.drops[i];
        var y = Math.round(d.y + Math.sin(d.t * 6) * 2);
        var x = Math.round(d.x);
        if (d.tipo === 'ouro') {
          ret(ctx, '#a67a00', x - 3, y - 3, 6, 6);
          ret(ctx, '#ffd23f', x - 2, y - 3, 4, 5);
          ret(ctx, '#fff3a0', x - 1, y - 2, 1, 2);
        } else {
          ret(ctx, '#c93a3a', x - 4, y - 3, 3, 3);
          ret(ctx, '#c93a3a', x + 1, y - 3, 3, 3);
          ret(ctx, '#c93a3a', x - 4, y - 1, 8, 3);
          ret(ctx, '#c93a3a', x - 2, y + 2, 4, 2);
          ret(ctx, '#ff8a8a', x - 3, y - 2, 1, 1);
        }
      }
    }

    draw(ctx, camera) {
      var b = this.bioma;
      var i;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      var ox = camera ? -camera.x : 0;
      var oy = camera ? -camera.y : 0;
      if (this.tremor.t > 0) {
        ox += rnd(-1, 1) * this.tremor.mag;
        oy += rnd(-1, 1) * this.tremor.mag;
      }
      ctx.translate(Math.round(ox), Math.round(oy));
      ret(ctx, b.fundo, -64, -64, this.largura + 128, this.altura + 128);
      if (this.piso) {
        ctx.drawImage(this.piso, 0, 0);
      } else {
        ret(ctx, b.chao[0], 0, 0, this.largura, this.altura);
      }
      this.desenharZonas(ctx);
      this.desenharDrops(ctx);
      var j = this.jogador;
      var lista = [j].concat(j.ajudantes ? j.ajudantes.membros : [], this.criaturas, this.obstaculos);
      lista.sort(function (p, q) { return p.y - q.y; });
      for (i = 0; i < lista.length; i++) {
        if (!lista[i].morto) lista[i].draw(ctx);
      }
      for (i = 0; i < this.projeteisJogador.length; i++) this.projeteisJogador[i].draw(ctx);
      for (i = 0; i < this.projeteisHostis.length; i++) this.projeteisHostis[i].draw(ctx);
      for (i = 0; i < this.particulas.length; i++) {
        var p = this.particulas[i];
        ctx.globalAlpha = limitar(1 - p.t / p.vida, 0, 1);
        ret(ctx, p.cor, p.x, p.y, p.tam, p.tam);
      }
      ctx.globalAlpha = 1;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      for (i = 0; i < this.popups.length; i++) {
        var pp = this.popups[i];
        ctx.globalAlpha = limitar(1 - pp.t / pp.dur, 0, 1);
        ctx.fillStyle = '#000000';
        ctx.fillText(pp.texto, Math.round(pp.x) + 1, Math.round(pp.y) + 1);
        ctx.fillStyle = pp.cor;
        ctx.fillText(pp.texto, Math.round(pp.x), Math.round(pp.y));
      }
      ctx.globalAlpha = 1;
      var t = (this.sub - 1) / (SUBNIVEIS - 1);
      ctx.fillStyle = rgba(b.neblina, 0.06 + 0.12 * t);
      ctx.fillRect(0, 0, this.largura, this.altura);
      for (i = 0; i < 6; i++) {
        ctx.fillStyle = 'rgba(0,0,0,' + (0.06 * (6 - i)).toFixed(2) + ')';
        ctx.fillRect(0, i * 8, this.largura, 8);
        ctx.fillRect(0, this.altura - (i + 1) * 8, this.largura, 8);
        ctx.fillRect(i * 8, 0, 8, this.altura);
        ctx.fillRect(this.largura - (i + 1) * 8, 0, 8, this.altura);
      }
      ctx.restore();
    }
  }

  class Campanha {
    constructor(o) {
      o = o || {};
      this.largura = o.largura || 960;
      this.altura = o.altura || 640;
      this.pausaTransicao = o.pausaTransicao || 3;
      this.aoEvento = o.aoEvento || null;
      this.jogador = null;
      this.mundo = 1;
      this.sub = 1;
      this.estado = 'parado';
      this.arena = null;
      this.transicaoT = 0;
      this.bannerAtual = null;
      this.melhor = { mundo: 1, sub: 1 };
    }

    get bioma() {
      return BIOMAS[this.mundo - 1];
    }

    get nivelGlobal() {
      return this.mundo > MUNDOS ? NIVEL_FINAL : (this.mundo - 1) * SUBNIVEIS + this.sub;
    }

    get ehBoss() {
      return this.mundo > MUNDOS || this.sub === SUBNIVEIS;
    }

    get ehFinal() {
      return this.mundo > MUNDOS;
    }

    emitir(tipo, dados) {
      if (this.aoEvento) this.aoEvento(tipo, dados || {});
    }

    definirBanner(texto, sub, dur) {
      this.bannerAtual = { texto: texto, sub: sub || '', t: 0, dur: dur || 2.5 };
    }

    iniciar(jogador, opcoes) {
      opcoes = opcoes || {};
      this.jogador = jogador;
      this.mundo = limitar(opcoes.mundo || 1, 1, MUNDOS + 1);
      this.sub = this.mundo > MUNDOS ? 1 : limitar(opcoes.sub || 1, 1, SUBNIVEIS);
      this.iniciarArena();
    }

    iniciarArena() {
      this.arena = new Arena({
        campanha: this,
        mundo: this.mundo,
        sub: this.sub,
        jogador: this.jogador,
        largura: this.largura,
        altura: this.altura
      });
      this.estado = 'jogando';
      this.transicaoT = 0;
      if (!this.arena.ehBoss) {
        this.definirBanner(this.bioma.nome, 'Nível ' + this.mundo + '-' + this.sub, 2.5);
      }
      this.registrarProgresso();
      this.emitir('nivel_iniciado', { mundo: this.mundo, sub: this.sub, nivel: this.nivelGlobal, boss: this.ehBoss });
    }

    reiniciar() {
      var j = this.jogador;
      if (!j) return;
      this.iniciar(j, { mundo: 1, sub: 1 });
    }

    contexto() {
      return this.arena.contexto();
    }

    avancar() {
      var j = this.jogador;
      if (this.mundo > MUNDOS) return;
      var novoMundo = false;
      this.sub++;
      if (this.sub > SUBNIVEIS) {
        this.sub = 1;
        this.mundo++;
        novoMundo = true;
        this.emitir('mundo_completo', { mundo: this.mundo - 1 });
      }
      var fracao = novoMundo ? 1 : 0.35;
      if (!j.morto) j.curar(Math.round(j.hpMax * fracao));
      if (j.ajudantes) {
        for (var i = 0; i < j.ajudantes.membros.length; i++) {
          j.ajudantes.membros[i].curar(Math.round(j.ajudantes.membros[i].hpMax * fracao));
        }
      }
      this.iniciarArena();
    }

    registrarProgresso() {
      var m = this.melhor;
      if (this.mundo > m.mundo || (this.mundo === m.mundo && this.sub > m.sub)) {
        this.melhor = { mundo: this.mundo, sub: this.sub };
        this.salvar();
      }
    }

    salvar() {
      try {
        global.localStorage.setItem(CHAVE_SAVE, JSON.stringify(this.melhor));
      } catch (e) {
        return false;
      }
      return true;
    }

    carregar() {
      try {
        var bruto = global.localStorage.getItem(CHAVE_SAVE);
        if (bruto) {
          var d = JSON.parse(bruto);
          if (d && d.mundo >= 1 && d.sub >= 1) this.melhor = { mundo: d.mundo, sub: d.sub };
        }
      } catch (e) {
        return this.melhor;
      }
      return this.melhor;
    }

    update(dt) {
      if (!this.arena) return;
      if (this.bannerAtual) {
        this.bannerAtual.t += dt;
        if (this.bannerAtual.t >= this.bannerAtual.dur) this.bannerAtual = null;
      }
      if (this.estado === 'jogando') {
        this.arena.update(dt);
        if (this.jogador.morto) {
          this.estado = 'derrota';
          this.definirBanner('DERROTA', 'Nível ' + this.nivelGlobal + ' alcançado', 99);
          this.emitir('derrota', { mundo: this.mundo, sub: this.sub });
        } else if (this.arena.concluida) {
          if (this.ehFinal) {
            this.estado = 'vitoria';
            this.definirBanner('VITÓRIA!', 'O Devorador de Mundos foi derrotado', 99);
            this.emitir('vitoria', {});
          } else {
            this.estado = 'transicao';
            this.transicaoT = 0;
            this.definirBanner(this.ehBoss ? 'MUNDO CONCLUÍDO' : 'NÍVEL CONCLUÍDO', this.bioma.nome + ' ' + this.mundo + '-' + this.sub, this.pausaTransicao);
          }
        }
      } else if (this.estado === 'transicao') {
        this.arena.update(dt);
        this.transicaoT += dt;
        if (this.transicaoT >= this.pausaTransicao) this.avancar();
      } else if (this.estado === 'vitoria' || this.estado === 'derrota') {
        this.arena.atualizarAmbiente(dt);
      }
    }

    draw(ctx, camera) {
      if (this.arena) this.arena.draw(ctx, camera);
    }

    desenharHUD(ctx) {
      if (!this.arena) return;
      var a = this.arena;
      var W = this.largura;
      var H = this.altura;
      var b = this.bioma;
      ctx.save();
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#000000';
      var titulo = this.ehFinal ? b.nome + '  FINAL' : b.nome + '  ' + this.mundo + '-' + this.sub;
      ctx.fillText(titulo, 33, 37);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(titulo, 32, 36);
      if (!a.ehBoss) {
        var r = limitar(a.abates / a.meta, 0, 1);
        ret(ctx, '#0a0a10', 30, 44, 154, 10);
        ret(ctx, '#2a2a38', 32, 46, 150, 6);
        ret(ctx, b.detalhe, 32, 46, 150 * r, 6);
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(a.abates + '/' + a.meta, 190, 53);
      }
      a.ameaca.desenhar(ctx, W - 212, 44, 180, 8);
      if (a.chefe && !a.chefe.morto) {
        var c = a.chefe;
        var bw = 360;
        var bx = Math.round(W / 2 - bw / 2);
        var by = H - 44;
        ret(ctx, '#0a0a10', bx - 3, by - 3, bw + 6, 16);
        ret(ctx, '#3a1a1a', bx, by, bw, 10);
        ret(ctx, c.def.final ? '#b05cff' : '#e03030', bx, by, bw * (c.hp / c.hpMax), 10);
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(c.nome + '  (Fase ' + c.fase + ')', W / 2, by - 8);
      }
      if (this.bannerAtual) {
        var bn = this.bannerAtual;
        var alfa = limitar(Math.min(bn.t / 0.3, (bn.dur - bn.t) / 0.5, 1), 0, 1);
        ctx.globalAlpha = alfa;
        ret(ctx, 'rgba(0,0,0,0.55)', 0, H / 2 - 44, W, 78);
        ctx.textAlign = 'center';
        ctx.font = 'bold 26px monospace';
        ctx.fillStyle = '#000000';
        ctx.fillText(bn.texto, W / 2 + 2, H / 2 - 2);
        ctx.fillStyle = b.detalhe;
        ctx.fillText(bn.texto, W / 2, H / 2 - 4);
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(bn.sub, W / 2, H / 2 + 20);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  }

  global.GameWorld = {
    TILE: TILE,
    MUNDOS: MUNDOS,
    SUBNIVEIS: SUBNIVEIS,
    NIVEL_FINAL: NIVEL_FINAL,
    BIOMAS: BIOMAS,
    SPRITES: SPRITES,
    CATALOGO: CATALOGO,
    BOSSES: BOSSES,
    FabricaCriaturas: FabricaCriaturas,
    Criatura: Criatura,
    ProjetilHostil: ProjetilHostil,
    Ameaca: Ameaca,
    Arena: Arena,
    Campanha: Campanha,
    escalaVida: escalaVida,
    escalaDano: escalaDano
  };
})(window);
