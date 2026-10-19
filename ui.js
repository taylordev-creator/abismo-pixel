(function (global) {
  'use strict';

  var GI = global.GameItems;
  var GE = global.GameEntities;
  var PRETO = '#0b0a12';

  function limitar(v, min, max) {
    return v < min ? min : (v > max ? max : v);
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

  function ajustar(hex, f) {
    var A = hexParaRgb(hex);
    return rgbParaHex(A[0] * f, A[1] * f, A[2] * f);
  }

  function misturar(a, b, t) {
    var A = hexParaRgb(a);
    var B = hexParaRgb(b);
    return rgbParaHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }

  function ret(ctx, cor, x, y, w, h) {
    ctx.fillStyle = cor;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function texto(ctx, t, x, y, cor, tam, alinhar, negrito) {
    ctx.font = (negrito === false ? '' : 'bold ') + tam + 'px monospace';
    ctx.textAlign = alinhar || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PRETO;
    ctx.fillText(t, Math.round(x) + 1, Math.round(y) + 1);
    ctx.fillStyle = cor;
    ctx.fillText(t, Math.round(x), Math.round(y));
  }

  function painel(ctx, x, y, w, h, borda, fundo) {
    ret(ctx, PRETO, x, y, w, h);
    ret(ctx, borda, x + 2, y + 2, w - 4, h - 4);
    ret(ctx, fundo, x + 4, y + 4, w - 8, h - 8);
  }

  function barra(ctx, x, y, w, h, r, cor, fundo) {
    ret(ctx, PRETO, x - 1, y - 1, w + 2, h + 2);
    ret(ctx, fundo || '#2a2a38', x, y, w, h);
    ret(ctx, cor, x, y, w * limitar(r, 0, 1), h);
    ret(ctx, 'rgba(255,255,255,0.18)', x, y, w * limitar(r, 0, 1), Math.max(1, Math.floor(h / 4)));
  }

  var RAR_COR = { comum: '#b8b8b8', incomum: '#5fd35f', raro: '#4a9eff', epico: '#b05cff', lendario: '#ffb020' };
  var RAR_NIVEL = { comum: 0, incomum: 1, raro: 2, epico: 3, lendario: 4 };
  var RAR_PESO = { comum: 50, incomum: 28, raro: 14, epico: 6, lendario: 2 };

  function corRaridade(r) {
    if (GI && GI.RARIDADES && GI.RARIDADES[r]) return GI.RARIDADES[r].cor;
    return RAR_COR[r] || '#ffffff';
  }

  function partesItem(it) {
    var p = [];
    if (it.dano) p.push('ATK ' + (it.dano > 0 ? '+' : '') + it.dano);
    if (it.defesa) p.push('DEF ' + (it.defesa > 0 ? '+' : '') + it.defesa);
    if (it.modificador_vida) p.push('HP ' + (it.modificador_vida > 0 ? '+' : '') + it.modificador_vida);
    if (it.velocidade) p.push('VEL ' + (it.velocidade > 0 ? '+' : '') + Math.round(it.velocidade * 100) + '%');
    return p;
  }

  function pontuacao(it) {
    if (!it) return 0;
    return it.dano * 2 + it.defesa * 2 + it.modificador_vida * 0.5 + it.velocidade * 20;
  }

  function nomeSlot(s) {
    return { arma: 'ARMA', capacete: 'CAPACETE', peitoral: 'PEITORAL', botas: 'BOTAS' }[s] || s.toUpperCase();
  }

  class Interface {
    constructor(canvas) {
      var self = this;
      this.canvas = canvas;
      this.pos = { x: -100, y: -100 };
      this.clique = null;
      this.baixo = false;
      this.toque = false;
      this.teclas = [];
      var conv = function (e) {
        var r = canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) * canvas.width / (r.width || 1), y: (e.clientY - r.top) * canvas.height / (r.height || 1) };
      };
      this.h = {
        down: function (e) {
          self.toque = e.pointerType ? e.pointerType !== 'mouse' : false;
          self.pos = conv(e);
          self.baixo = true;
        },
        move: function (e) {
          self.pos = conv(e);
        },
        up: function (e) {
          self.pos = conv(e);
          self.baixo = false;
          self.clique = { x: self.pos.x, y: self.pos.y };
        },
        cancelar: function () {
          self.baixo = false;
        },
        tecla: function (e) {
          self.teclas.push(e.key.toLowerCase());
        }
      };
      if (global.PointerEvent) {
        canvas.addEventListener('pointerdown', this.h.down);
        canvas.addEventListener('pointermove', this.h.move);
        canvas.addEventListener('pointerup', this.h.up);
        canvas.addEventListener('pointercancel', this.h.cancelar);
      } else {
        canvas.addEventListener('mousedown', this.h.down);
        canvas.addEventListener('mousemove', this.h.move);
        canvas.addEventListener('mouseup', this.h.up);
      }
      global.addEventListener('keydown', this.h.tecla);
    }

    dentro(p, x, y, w, h, folga) {
      var f = folga || 0;
      return p.x >= x - f && p.x <= x + w + f && p.y >= y - f && p.y <= y + h + f;
    }

    sobre(x, y, w, h) {
      return !this.toque && this.dentro(this.pos, x, y, w, h, 0);
    }

    zona(x, y, w, h) {
      if (this.clique && this.dentro(this.clique, x, y, w, h, this.toque ? 4 : 0)) {
        this.clique = null;
        return true;
      }
      return false;
    }

    tecla(k) {
      var i = this.teclas.indexOf(k);
      if (i >= 0) {
        this.teclas.splice(i, 1);
        return true;
      }
      return false;
    }

    botao(ctx, x, y, w, h, rotulo, op) {
      op = op || {};
      var cor = op.cor || '#3a6bc9';
      var off = !!op.desabilitado;
      var hover = !off && this.sobre(x, y, w, h);
      var press = !off && this.baixo && this.dentro(this.pos, x, y, w, h, this.toque ? 4 : 0);
      var base = off ? '#3a3a46' : (hover ? misturar(cor, '#ffffff', 0.18) : cor);
      var dy = press ? 2 : 0;
      ret(ctx, PRETO, x, y, w, h);
      ret(ctx, ajustar(base, 0.6), x + 2, y + 2 + dy, w - 4, h - 4 - dy);
      ret(ctx, base, x + 2, y + 2 + dy, w - 4, h - 8 - dy);
      ret(ctx, misturar(base, '#ffffff', 0.35), x + 3, y + 3 + dy, w - 6, 2);
      texto(ctx, rotulo, x + w / 2, y + h / 2 + 5 + dy, off ? '#7a7a88' : '#ffffff', op.tam || 14, 'center');
      if (off) return false;
      if (this.clique && this.dentro(this.clique, x, y, w, h, this.toque ? 6 : 0)) {
        this.clique = null;
        return true;
      }
      return false;
    }

    fimQuadro() {
      this.clique = null;
      this.teclas.length = 0;
    }
  }

  var CLASSES_MENU = ['mago', 'cavaleiro', 'arqueiro', 'anao', 'aleatorio'];
  var COR_CLASSE = { mago: '#7a5cff', cavaleiro: '#4a9eff', arqueiro: '#4cd04c', anao: '#ff8a3a', aleatorio: '#ffd23f' };

  class Menu {
    constructor() {
      this.sel = 1;
      this.t = 0;
      this.previews = {};
      for (var i = 0; i < CLASSES_MENU.length - 1; i++) {
        var id = CLASSES_MENU[i];
        var p = new GE.Player({ classe: id });
        p.pixel = 5;
        this.previews[id] = p;
      }
      this.sorteado = null;
      this.tSorteio = 0;
      this.estrelas = [];
      for (var k = 0; k < 70; k++) {
        this.estrelas.push({ x: Math.random() * 960, y: Math.random() * 640, v: 6 + Math.random() * 24, c: Math.random() < 0.2 ? '#b05cff' : '#6a6a8a' });
      }
    }

    sortear() {
      this.sorteado = new GE.Player({ classe: 'aleatorio' });
      this.sorteado.pixel = 5;
    }

    desenhar(ctx, dt, ui, info, audio) {
      var W = 960;
      var H = 640;
      var i;
      this.t += dt;
      this.tSorteio -= dt;
      if (!this.sorteado || this.tSorteio <= 0) {
        this.sortear();
        this.tSorteio = 1.2;
      }
      ret(ctx, '#0a0814', 0, 0, W, H);
      for (i = 0; i < this.estrelas.length; i++) {
        var s = this.estrelas[i];
        s.y += s.v * dt;
        if (s.y > H) {
          s.y = 0;
          s.x = Math.random() * W;
        }
        ret(ctx, s.c, s.x, s.y, 2, 2);
      }
      texto(ctx, 'ABISMO PIXEL', W / 2, 84, '#ffd23f', 56, 'center');
      texto(ctx, 'Roguelike de 4 mundos  -  1 Final Boss', W / 2, 114, '#9a9ab4', 14, 'center', false);

      var cw = 168;
      var ch = 262;
      var gap = 14;
      var x0 = Math.round((W - (5 * cw + 4 * gap)) / 2);
      var y0 = 140;
      var resultado = null;
      for (i = 0; i < CLASSES_MENU.length; i++) {
        var id = CLASSES_MENU[i];
        var x = x0 + i * (cw + gap);
        var cor = COR_CLASSE[id];
        var sel = i === this.sel;
        var hover = ui.sobre(x, y0, cw, ch);
        if (ui.zona(x, y0, cw, ch)) {
          if (this.sel === i) resultado = { acao: 'jogar', classe: id, continuar: false };
          this.sel = i;
          audio.tocar('clique');
        }
        painel(ctx, x, y0 - (sel ? 6 : 0), cw, ch, sel ? cor : ajustar(cor, 0.55), sel ? '#1c1a2e' : (hover ? '#18162a' : '#121022'));
        var yy = y0 - (sel ? 6 : 0);
        var rotulo = id === 'aleatorio' ? 'ALEATÓRIO' : GE.CLASSES[id].nome.toUpperCase();
        texto(ctx, rotulo, x + cw / 2, yy + 28, cor, 16, 'center');
        var p = id === 'aleatorio' ? this.sorteado : this.previews[id];
        p.x = x + cw / 2 - 8;
        p.y = yy + 150;
        p.tempo = this.t;
        p.passo = Math.floor(this.t * 4);
        p.direcao = 1;
        p.draw(ctx);
        if (id === 'aleatorio') {
          texto(ctx, 'Classe e itens', x + cw / 2, yy + 190, '#c8c8d8', 11, 'center', false);
          texto(ctx, 'sorteados!', x + cw / 2, yy + 205, '#c8c8d8', 11, 'center', false);
          texto(ctx, 'VIDA ???  ATK ???', x + cw / 2, yy + 232, '#7a7a94', 11, 'center', false);
        } else {
          var cfg = GE.CLASSES[id];
          var st = p.stats;
          texto(ctx, 'VIDA ' + st.vida_maxima + '   ATK ' + st.dano, x + cw / 2, yy + 190, '#c8c8d8', 11, 'center', false);
          texto(ctx, 'DEF ' + st.defesa + '   VEL ' + st.velocidade.toFixed(2), x + cw / 2, yy + 205, '#c8c8d8', 11, 'center', false);
          texto(ctx, 'Q: ' + cfg.habilidade.nome, x + cw / 2, yy + 232, cor, 11, 'center');
          texto(ctx, 'recarga ' + cfg.habilidade.recarga + 's', x + cw / 2, yy + 246, '#7a7a94', 10, 'center', false);
        }
      }

      if (ui.botao(ctx, W / 2 - 110, 430, 220, 52, 'JOGAR', { cor: '#2f9a4a', tam: 20 }) || ui.tecla('enter')) {
        resultado = { acao: 'jogar', classe: CLASSES_MENU[this.sel], continuar: false };
      }
      var m = info.melhor;
      var temSave = m && (m.mundo > 1 || m.sub > 1);
      if (temSave) {
        if (ui.botao(ctx, W / 2 - 130, 492, 260, 40, 'CONTINUAR (' + m.mundo + '-' + m.sub + ')', { cor: '#3a6bc9' })) {
          resultado = { acao: 'jogar', classe: CLASSES_MENU[this.sel], continuar: true };
        }
      }
      if (ui.botao(ctx, W - 132, 18, 114, 34, audio.mudo ? 'SOM: OFF' : 'SOM: ON', { cor: '#5a4a8a', tam: 12 })) {
        audio.alternarMudo();
      }
      if (ui.tecla('arrowleft')) this.sel = (this.sel + 4) % 5;
      if (ui.tecla('arrowright')) this.sel = (this.sel + 1) % 5;
      for (i = 1; i <= 5; i++) {
        if (ui.tecla(String(i))) this.sel = i - 1;
      }
      texto(ctx, 'WASD mover  |  Mouse / Espaço atacar  |  Q habilidade  |  P pausa  |  M som', W / 2, 584, '#7a7a94', 12, 'center', false);
      texto(ctx, 'Toque: analógico à esquerda, botões à direita', W / 2, 604, '#5a5a74', 11, 'center', false);
      return resultado;
    }
  }

  class HUD {
    constructor() {
      this.toasts = [];
    }

    toast(t, cor) {
      this.toasts.push({ t: t, cor: cor || '#ffffff', idade: 0, dur: 2.6 });
      if (this.toasts.length > 4) this.toasts.shift();
    }

    limpar() {
      this.toasts.length = 0;
    }

    desenhar(ctx, dt, jogador, campanha) {
      var W = 960;
      var H = 640;
      var i;
      var x = 14;
      var y = H - 94;
      painel(ctx, x, y, 244, 80, '#3a3a52', '#121022');
      var cfg = jogador.config;
      texto(ctx, cfg.nome.toUpperCase() + (jogador.modoAleatorio ? '*' : ''), x + 10, y + 20, '#ffffff', 11);
      var ordem = GI.SLOTS;
      for (i = 0; i < ordem.length; i++) {
        var id = jogador.equipamento[ordem[i]];
        var ix = x + 136 + i * 26;
        if (id) {
          GI.desenharIcone(ctx, id, ix, y + 8, 3);
        } else {
          ret(ctx, '#22203a', ix, y + 8, 24, 24);
        }
      }
      var rv = jogador.hp / jogador.hpMax;
      barra(ctx, x + 10, y + 38, 224, 12, rv, rv > 0.5 ? '#4cd04c' : (rv > 0.25 ? '#e0c030' : '#e04040'), '#3a1a1a');
      texto(ctx, Math.ceil(jogador.hp) + ' / ' + jogador.hpMax, x + 122, y + 48, '#ffffff', 10, 'center');
      var rh = jogador.cdHabilidade > 0 ? 1 - jogador.cdHabilidade / cfg.habilidade.recarga : 1;
      barra(ctx, x + 10, y + 56, 120, 6, rh, rh >= 1 ? '#7a5cff' : '#4a4a66', '#22203a');
      texto(ctx, rh >= 1 ? '[Q] PRONTO' : '[Q] ' + jogador.cdHabilidade.toFixed(1) + 's', x + 136, y + 63, rh >= 1 ? '#b8a6ff' : '#7a7a94', 10);
      ret(ctx, '#a67a00', x + 10, y + 66, 8, 8);
      ret(ctx, '#ffd23f', x + 11, y + 66, 6, 7);
      texto(ctx, String(jogador.ouro || 0), x + 24, y + 74, '#ffd23f', 11);
      var st = jogador.stats;
      texto(ctx, 'A' + st.dano + ' D' + st.defesa + ' V' + st.velocidade.toFixed(2), x + 234, y + 74, '#9a9ab4', 10, 'right', false);

      var aj = jogador.ajudantes ? jogador.ajudantes.membros : [];
      for (i = 0; i < aj.length; i++) {
        var c = aj[i];
        var ay = H - 24 - (aj.length - i) * 34;
        var ax = W - 214;
        painel(ctx, ax, ay, 200, 30, ajustar(c.marca, 0.7), '#121022');
        var arma = c.equipamento.arma;
        if (arma) {
          GI.desenharIcone(ctx, arma, ax + 6, ay + 7, 2);
        }
        texto(ctx, c.nome, ax + 28, ay + 14, '#ffffff', 10);
        var rc = c.hp / c.hpMax;
        barra(ctx, ax + 28, ay + 18, 160, 6, rc, rc > 0.5 ? '#4cd04c' : (rc > 0.25 ? '#e0c030' : '#e04040'), '#3a1a1a');
      }

      for (i = this.toasts.length - 1; i >= 0; i--) {
        this.toasts[i].idade += dt;
        if (this.toasts[i].idade >= this.toasts[i].dur) this.toasts.splice(i, 1);
      }
      for (i = 0; i < this.toasts.length; i++) {
        var ts = this.toasts[i];
        ctx.save();
        ctx.globalAlpha = limitar(Math.min(ts.idade / 0.2, (ts.dur - ts.idade) / 0.5, 1), 0, 1);
        texto(ctx, ts.t, W / 2, 112 + i * 18, ts.cor, 13, 'center');
        ctx.restore();
      }
    }
  }

  class ControlesToque {
    constructor(canvas) {
      var self = this;
      this.canvas = canvas;
      this.ativo = !!(('ontouchstart' in global) || (global.navigator && global.navigator.maxTouchPoints > 0));
      this.habilitado = false;
      this.raio = 64;
      this.stick = { id: null, cx: 0, cy: 0, x: 0, y: 0 };
      this.atk = { id: null, x: 850, y: 530, r: 56 };
      this.hab = { id: null, x: 730, y: 570, r: 40 };
      var conv = function (e) {
        var r = canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) * canvas.width / (r.width || 1), y: (e.clientY - r.top) * canvas.height / (r.height || 1) };
      };
      var dist = function (p, b) {
        return Math.sqrt((p.x - b.x) * (p.x - b.x) + (p.y - b.y) * (p.y - b.y));
      };
      this.h = {
        down: function (e) {
          if (e.pointerType === 'mouse') return;
          self.ativo = true;
          if (!self.habilitado) return;
          var p = conv(e);
          if (dist(p, self.atk) <= self.atk.r + 16 && self.atk.id === null) {
            self.atk.id = e.pointerId;
          } else if (dist(p, self.hab) <= self.hab.r + 16 && self.hab.id === null) {
            self.hab.id = e.pointerId;
          } else if (p.x < 960 * 0.45 && self.stick.id === null) {
            self.stick.id = e.pointerId;
            self.stick.cx = p.x;
            self.stick.cy = p.y;
            self.stick.x = p.x;
            self.stick.y = p.y;
          } else {
            return;
          }
          try { canvas.setPointerCapture(e.pointerId); } catch (err) { return; }
          if (e.cancelable) e.preventDefault();
        },
        move: function (e) {
          if (e.pointerId === self.stick.id) {
            var p = conv(e);
            self.stick.x = p.x;
            self.stick.y = p.y;
          }
        },
        up: function (e) {
          if (e.pointerId === self.stick.id) self.stick.id = null;
          if (e.pointerId === self.atk.id) self.atk.id = null;
          if (e.pointerId === self.hab.id) self.hab.id = null;
        }
      };
      if (global.PointerEvent) {
        canvas.addEventListener('pointerdown', this.h.down);
        canvas.addEventListener('pointermove', this.h.move);
        canvas.addEventListener('pointerup', this.h.up);
        canvas.addEventListener('pointercancel', this.h.up);
      }
    }

    liberar() {
      this.stick.id = null;
      this.atk.id = null;
      this.hab.id = null;
    }

    ler() {
      var s = this.stick;
      var r = { dx: 0, dy: 0, atacar: false, habilidade: false, ativo: this.ativo && this.habilitado };
      if (!r.ativo) return r;
      if (s.id !== null) {
        var vx = (s.x - s.cx) / this.raio;
        var vy = (s.y - s.cy) / this.raio;
        var l = Math.sqrt(vx * vx + vy * vy);
        if (l > 0.2) {
          r.dx = vx / Math.max(1, l);
          r.dy = vy / Math.max(1, l);
        }
      }
      r.atacar = this.atk.id !== null;
      r.habilidade = this.hab.id !== null;
      return r;
    }

    desenhar(ctx) {
      if (!this.ativo || !this.habilitado) return;
      var s = this.stick;
      var bx = s.id !== null ? s.cx : 130;
      var by = s.id !== null ? s.cy : 510;
      ctx.save();
      ctx.globalAlpha = 0.35;
      this.disco(ctx, bx, by, this.raio, '#ffffff');
      ctx.globalAlpha = 0.6;
      var kx = bx;
      var ky = by;
      if (s.id !== null) {
        var vx = s.x - s.cx;
        var vy = s.y - s.cy;
        var l = Math.sqrt(vx * vx + vy * vy) || 1;
        var m = Math.min(l, this.raio);
        kx = bx + vx / l * m;
        ky = by + vy / l * m;
      }
      this.disco(ctx, kx, ky, 26, '#ffffff');
      ctx.globalAlpha = this.atk.id !== null ? 0.8 : 0.45;
      this.disco(ctx, this.atk.x, this.atk.y, this.atk.r, '#e04040');
      ctx.globalAlpha = this.hab.id !== null ? 0.8 : 0.45;
      this.disco(ctx, this.hab.x, this.hab.y, this.hab.r, '#7a5cff');
      ctx.globalAlpha = 1;
      texto(ctx, 'ATK', this.atk.x, this.atk.y + 5, '#ffffff', 14, 'center');
      texto(ctx, 'Q', this.hab.x, this.hab.y + 5, '#ffffff', 14, 'center');
      ctx.restore();
    }

    disco(ctx, cx, cy, r, cor) {
      ctx.fillStyle = cor;
      for (var y = -r; y <= r; y += 4) {
        var w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)) / 4) * 4;
        ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 4);
      }
    }
  }

  class Loja {
    constructor() {
      this.jogador = null;
      this.nivel = 1;
      this.ofertas = [];
      this.alvo = 0;
      this.sel = -1;
      this.aoContinuar = null;
      this.hud = null;
      this.rerolls = 0;
    }

    abrir(jogador, nivel, hud, aoContinuar) {
      this.jogador = jogador;
      this.nivel = Math.max(1, nivel);
      this.hud = hud;
      this.aoContinuar = aoContinuar;
      this.alvo = 0;
      this.sel = -1;
      this.rerolls = 0;
      this.gerarOfertas();
    }

    custo(base) {
      return Math.round(base * (1 + 0.08 * (this.nivel - 1)));
    }

    gerarOfertas() {
      var self = this;
      var armas = GI.listarPorCategoria('arma');
      var armaduras = GI.listarPorCategoria('armadura');
      var usados = {};
      var out = [];
      var pick = function (lista) {
        var livres = lista.filter(function (i) { return !usados[i.id]; });
        if (!livres.length) return null;
        var bonus = 1 + 0.04 * self.nivel;
        var total = 0;
        var pesos = livres.map(function (i) {
          var w = RAR_PESO[i.raridade] * Math.pow(bonus, RAR_NIVEL[i.raridade]);
          total += w;
          return w;
        });
        var r = Math.random() * total;
        for (var k = 0; k < livres.length; k++) {
          r -= pesos[k];
          if (r <= 0) return livres[k];
        }
        return livres[livres.length - 1];
      };
      var plano = [armas, armas, armaduras, armaduras, armas.concat(armaduras), armas.concat(armaduras)];
      for (var i = 0; i < plano.length; i++) {
        var it = pick(plano[i]);
        if (it) {
          usados[it.id] = true;
          out.push({ item: it, vendido: false });
        }
      }
      this.ofertas = out;
    }

    alvoEntidade() {
      var j = this.jogador;
      var aj = j.ajudantes ? j.ajudantes.membros : [];
      if (this.alvo > aj.length) this.alvo = 0;
      return this.alvo === 0 ? j : aj[this.alvo - 1];
    }

    equiparNoAlvo(id) {
      var j = this.jogador;
      if (this.alvo === 0) {
        j.equipar(id);
      } else {
        j.entregarAoAjudante(this.alvo - 1, id);
      }
    }

    desenhar(ctx, ui, audio) {
      var W = 960;
      var H = 640;
      var j = this.jogador;
      var i;
      ctx.fillStyle = 'rgba(5,4,10,0.94)';
      ctx.fillRect(0, 0, W, H);
      texto(ctx, 'LOJA', 24, 44, '#ffd23f', 30);
      ret(ctx, '#a67a00', W - 170, 26, 14, 14);
      ret(ctx, '#ffd23f', W - 168, 26, 10, 12);
      texto(ctx, String(j.ouro || 0), W - 148, 40, '#ffd23f', 20);

      for (i = 0; i < this.ofertas.length; i++) {
        var o = this.ofertas[i];
        var it = o.item;
        var x = 24 + (i % 3) * 206;
        var y = 64 + Math.floor(i / 3) * 114;
        var cor = corRaridade(it.raridade);
        var pode = !o.vendido && (j.ouro || 0) >= it.preco;
        painel(ctx, x, y, 196, 104, o.vendido ? '#2a2a36' : cor, ui.sobre(x, y, 196, 104) ? '#1c1a30' : '#121022');
        if (!o.vendido) GI.desenharIcone(ctx, it.id, x + 10, y + 12, 5);
        ctx.save();
        if (o.vendido) ctx.globalAlpha = 0.35;
        texto(ctx, it.nome, x + 58, y + 24, cor, 11);
        var partes = partesItem(it);
        texto(ctx, partes.slice(0, 2).join('  '), x + 58, y + 40, '#c8c8d8', 10, 'left', false);
        texto(ctx, partes.slice(2).join('  '), x + 58, y + 53, '#c8c8d8', 10, 'left', false);
        var atual = this.alvoEntidade().equipamento[it.slot];
        var melhor = pontuacao(it) > pontuacao(GI.obter(atual));
        texto(ctx, nomeSlot(it.slot) + (melhor ? '  ▲' : '  ▼'), x + 58, y + 67, melhor ? '#7aff9a' : '#ff8a8a', 10, 'left', false);
        ctx.restore();
        if (o.vendido) {
          texto(ctx, 'VENDIDO', x + 98, y + 60, '#7a7a88', 16, 'center');
        } else {
          if (ui.botao(ctx, x + 10, y + 74, 176, 22, 'COMPRAR  ' + it.preco, { cor: pode ? '#2f9a4a' : '#5a3a3a', tam: 11 })) {
            if (pode) {
              j.ouro -= it.preco;
              j.inventario.push(it.id);
              o.vendido = true;
              audio.tocar('compra');
              this.hud.toast('Comprou ' + it.nome, corRaridade(it.raridade));
            } else {
              audio.tocar('erro');
              this.hud.toast('Ouro insuficiente', '#ff8a8a');
            }
          }
        }
      }

      var sx = 660;
      texto(ctx, 'SERVIÇOS', sx, 78, '#9a9ab4', 12);
      var cPocao = this.custo(40);
      if (ui.botao(ctx, sx, 90, 276, 40, 'POÇÃO +50% VIDA  (' + cPocao + ')', { cor: '#a63a4a', desabilitado: j.hp >= j.hpMax, tam: 12 })) {
        if ((j.ouro || 0) >= cPocao) {
          j.ouro -= cPocao;
          j.curar(Math.round(j.hpMax * 0.5));
          audio.tocar('compra');
        } else {
          audio.tocar('erro');
        }
      }
      var cRec = this.custo(150);
      var cheio = j.ajudantes ? j.ajudantes.cheio : true;
      if (ui.botao(ctx, sx, 138, 276, 40, 'RECRUTAR AJUDANTE  (' + cRec + ')', { cor: '#3a6bc9', desabilitado: cheio, tam: 12 })) {
        if ((j.ouro || 0) >= cRec) {
          j.ouro -= cRec;
          var novo = j.ajudantes.adicionar({ aleatorio: true });
          audio.tocar('compra');
          if (novo) this.hud.toast(novo.nome + ' se juntou ao grupo', '#7aff9a');
        } else {
          audio.tocar('erro');
        }
      }
      var cCura = this.custo(60);
      var aj = j.ajudantes ? j.ajudantes.membros : [];
      var feridos = aj.some(function (m) { return m.hp < m.hpMax; });
      if (ui.botao(ctx, sx, 186, 276, 40, 'CURAR AJUDANTES  (' + cCura + ')', { cor: '#2f8a6a', desabilitado: !feridos, tam: 12 })) {
        if ((j.ouro || 0) >= cCura) {
          j.ouro -= cCura;
          aj.forEach(function (m) { m.curar(m.hpMax); });
          audio.tocar('compra');
        } else {
          audio.tocar('erro');
        }
      }
      var cRe = this.custo(25) * (1 + this.rerolls);
      if (ui.botao(ctx, sx, 234, 276, 40, 'NOVAS OFERTAS  (' + cRe + ')', { cor: '#8a5a2b', tam: 12 })) {
        if ((j.ouro || 0) >= cRe) {
          j.ouro -= cRe;
          this.rerolls++;
          this.gerarOfertas();
          audio.tocar('compra');
        } else {
          audio.tocar('erro');
        }
      }

      texto(ctx, 'EQUIPAR EM:', 24, 318, '#9a9ab4', 12);
      var nAlvos = 1 + aj.length;
      for (i = 0; i < nAlvos; i++) {
        var nomeAlvo = i === 0 ? 'HERÓI' : aj[i - 1].nome.toUpperCase();
        if (ui.botao(ctx, 120 + i * 136, 302, 128, 24, nomeAlvo, { cor: i === this.alvo ? '#ffb020' : '#3a3a52', tam: 11 })) {
          this.alvo = i;
          audio.tocar('clique');
        }
      }
      var ent = this.alvoEntidade();
      var slots = GI.SLOTS;
      for (i = 0; i < slots.length; i++) {
        var sxp = 24 + i * 156;
        var id = ent.equipamento[slots[i]];
        var itx = GI.obter(id);
        painel(ctx, sxp, 334, 148, 52, itx ? corRaridade(itx.raridade) : '#2a2a3a', '#121022');
        texto(ctx, nomeSlot(slots[i]), sxp + 8, 349, '#7a7a94', 9, 'left', false);
        if (itx) {
          GI.desenharIcone(ctx, id, sxp + 8, 354, 3);
          texto(ctx, itx.nome.length > 14 ? itx.nome.slice(0, 13) + '.' : itx.nome, sxp + 38, 366, '#ffffff', 10);
          texto(ctx, partesItem(itx).join(' ').slice(0, 20), sxp + 38, 379, '#9a9ab4', 9, 'left', false);
          if (ui.zona(sxp, 334, 148, 52)) {
            var removido = ent.desequipar(slots[i]);
            if (removido) j.inventario.push(removido);
            audio.tocar('clique');
          }
        } else {
          texto(ctx, 'vazio', sxp + 8, 372, '#4a4a60', 11, 'left', false);
        }
      }

      texto(ctx, 'INVENTÁRIO  (' + j.inventario.length + ')', 24, 414, '#9a9ab4', 12);
      if (this.sel >= j.inventario.length) this.sel = -1;
      for (i = 0; i < 16; i++) {
        var ix = 24 + (i % 8) * 62;
        var iy = 424 + Math.floor(i / 8) * 62;
        var idv = j.inventario[i];
        var itv = GI.obter(idv);
        painel(ctx, ix, iy, 56, 56, i === this.sel ? '#ffffff' : (itv ? corRaridade(itv.raridade) : '#22203a'), ui.sobre(ix, iy, 56, 56) ? '#1c1a30' : '#121022');
        if (itv) {
          GI.desenharIcone(ctx, idv, ix + 8, iy + 8, 5);
          if (ui.zona(ix, iy, 56, 56)) {
            this.sel = i;
            audio.tocar('clique');
          }
        }
      }

      var dx = 540;
      painel(ctx, dx, 414, 396, 108, '#3a3a52', '#121022');
      var selId = this.sel >= 0 ? j.inventario[this.sel] : null;
      var its = GI.obter(selId);
      if (its) {
        var corS = corRaridade(its.raridade);
        GI.desenharIcone(ctx, selId, dx + 12, 426, 5);
        texto(ctx, its.nome, dx + 62, 440, corS, 13);
        texto(ctx, nomeSlot(its.slot) + '  -  ' + its.raridade.toUpperCase(), dx + 62, 456, '#9a9ab4', 10, 'left', false);
        texto(ctx, partesItem(its).join('   '), dx + 62, 472, '#c8c8d8', 11, 'left', false);
        if (ui.botao(ctx, dx + 12, 484, 180, 30, 'EQUIPAR', { cor: '#2f9a4a', tam: 12 })) {
          j.inventario.splice(this.sel, 1);
          this.sel = -1;
          this.equiparNoAlvo(selId);
          audio.tocar('compra');
        }
        var venda = Math.floor(its.preco * 0.4);
        if (ui.botao(ctx, dx + 204, 484, 180, 30, 'VENDER  +' + venda, { cor: '#a67a00', tam: 12 })) {
          j.inventario.splice(this.sel, 1);
          this.sel = -1;
          j.ouro = (j.ouro || 0) + venda;
          audio.tocar('moeda');
        }
      } else {
        texto(ctx, 'Selecione um item do inventário', dx + 198, 472, '#5a5a74', 12, 'center', false);
      }

      if (ui.botao(ctx, W - 220, 568, 196, 48, 'CONTINUAR  >>', { cor: '#2f9a4a', tam: 16 }) || ui.tecla('enter')) {
        audio.tocar('clique');
        if (this.aoContinuar) this.aoContinuar();
      }
      texto(ctx, 'Clique em um item equipado para guardá-lo no inventário', 24, 588, '#5a5a74', 11, 'left', false);
    }
  }

  class TelaFinal {
    desenhar(ctx, ui, tipo, dados, audio) {
      var W = 960;
      var H = 640;
      var vitoria = tipo === 'vitoria';
      ctx.fillStyle = vitoria ? 'rgba(20,14,2,0.86)' : 'rgba(20,2,4,0.86)';
      ctx.fillRect(0, 0, W, H);
      texto(ctx, vitoria ? 'VITÓRIA!' : 'DERROTA', W / 2, 180, vitoria ? '#ffd23f' : '#e04040', 64, 'center');
      texto(ctx, vitoria ? 'O Devorador de Mundos foi destruído.' : 'Sua jornada termina aqui.', W / 2, 220, '#c8c8d8', 16, 'center', false);
      var linhas = [
        'Classe: ' + dados.classe,
        'Nível alcançado: ' + dados.nivel + ' / ' + dados.total,
        'Ouro: ' + dados.ouro,
        'Cartas escolhidas: ' + dados.cartas,
        'Ajudantes vivos: ' + dados.ajudantes,
        'Tempo: ' + dados.tempo
      ];
      for (var i = 0; i < linhas.length; i++) {
        texto(ctx, linhas[i], W / 2, 280 + i * 26, '#ffffff', 16, 'center', false);
      }
      var acao = null;
      if (ui.botao(ctx, W / 2 - 130, 470, 260, 52, vitoria ? 'JOGAR DE NOVO' : 'TENTAR NOVAMENTE', { cor: '#2f9a4a', tam: 16 }) || ui.tecla('enter')) {
        acao = 'menu';
      }
      return acao;
    }
  }

  global.GameUI = {
    Interface: Interface,
    Menu: Menu,
    HUD: HUD,
    ControlesToque: ControlesToque,
    Loja: Loja,
    TelaFinal: TelaFinal,
    texto: texto,
    painel: painel,
    barra: barra
  };
})(window);
