(function (global) {
  'use strict';

  var GI = global.GameItems;
  if (!GI) {
    throw new Error('GameItems não encontrado: carregue items.js antes de entities.js');
  }

  var TAU = Math.PI * 2;
  var BASE_VEL = 85;

  var PESOS_RARIDADE = { comum: 10, incomum: 7, raro: 4, epico: 2, lendario: 1 };
  var CORES_PELE = ['#f2c9a0', '#e0a97a', '#c68a5a', '#8d5a3a', '#f7dcc0'];
  var CORES_CABELO = ['#4a2f1a', '#1a1a1a', '#d9b45a', '#a33a1a', '#c9c9c9', '#5a2a7a'];

  var RANGED = {
    arco: { vel: 340, alcance: 360, tipo: 'flecha', cor: '#d9c38a', perfura: false },
    cajado: { vel: 230, alcance: 260, tipo: 'magia', cor: '#aad4ff', perfura: false }
  };

  var PALETAS_AJUDANTE = [
    { pele: '#f2c9a0', cabelo: '#c93a3a', olhos: '#1a1a1a', roupa: '#c93a3a', roupa_sombra: '#8a2020', marca: '#ff6a6a' },
    { pele: '#e0a97a', cabelo: '#1a1a1a', olhos: '#1a1a1a', roupa: '#3ac96a', roupa_sombra: '#208a46', marca: '#7aff9a' },
    { pele: '#f7dcc0', cabelo: '#d9b45a', olhos: '#1a1a1a', roupa: '#e0b030', roupa_sombra: '#9a7810', marca: '#ffe27a' }
  ];

  var CLASSES = {
    mago: {
      nome: 'Mago',
      base: { dano: 2, defesa: 0, vida_maxima: 80, velocidade: 1 },
      aparencia: { pele: '#f2c9a0', cabelo: '#d9d9d9', olhos: '#1a1a1a', roupa: '#5a3ac9', roupa_sombra: '#3a2290' },
      equipamento: { arma: 'cajado_aprendiz', capacete: null, peitoral: 'peitoral_tecido', botas: 'botas_pano' },
      habilidade: { nome: 'Nova Arcana', tipo: 'nova', recarga: 6 }
    },
    cavaleiro: {
      nome: 'Cavaleiro',
      base: { dano: 2, defesa: 2, vida_maxima: 110, velocidade: 1 },
      aparencia: { pele: '#f2c9a0', cabelo: '#4a2f1a', olhos: '#1a1a1a', roupa: '#3a6bc9', roupa_sombra: '#264a8a' },
      equipamento: { arma: 'espada_ferro', capacete: 'capacete_ferro', peitoral: 'peitoral_malha', botas: 'botas_couro' },
      habilidade: { nome: 'Escudo Sagrado', tipo: 'escudo', recarga: 8 }
    },
    arqueiro: {
      nome: 'Arqueiro',
      base: { dano: 2, defesa: 0, vida_maxima: 90, velocidade: 1.1 },
      aparencia: { pele: '#e0a97a', cabelo: '#a33a1a', olhos: '#1a1a1a', roupa: '#3a8a4a', roupa_sombra: '#26602f' },
      equipamento: { arma: 'arco_curto', capacete: 'capacete_couro', peitoral: 'peitoral_couro', botas: 'botas_couro' },
      habilidade: { nome: 'Rajada', tipo: 'rajada', recarga: 5 }
    },
    anao: {
      nome: 'Anão',
      base: { dano: 3, defesa: 4, vida_maxima: 140, velocidade: 0.85 },
      aparencia: { pele: '#e0a97a', cabelo: '#c9622a', olhos: '#1a1a1a', roupa: '#8a5a2b', roupa_sombra: '#5a3a1a' },
      equipamento: { arma: 'machado_lenhador', capacete: 'capacete_ferro', peitoral: 'peitoral_malha', botas: 'botas_ferro' },
      barba: true,
      habilidade: { nome: 'Fúria Anã', tipo: 'furia', recarga: 9, duracao: 5 }
    }
  };

  function rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function escolher(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function copiar(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function limitar(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  }

  function angDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return d;
  }

  function distancia(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function centroDe(e) {
    if (typeof e.centro === 'function') return e.centro();
    return { x: e.x + (e.w || 0) / 2, y: e.y + (e.h || 0) / 2 };
  }

  function raioDe(e) {
    if (e.raio) return e.raio;
    if (e.w) return Math.max(e.w, e.h || e.w) / 2;
    return 8;
  }

  function vivo(e) {
    return !e.morto && !e.dead && (e.hp === undefined || e.hp > 0);
  }

  function aplicarDano(alvo, dano, origem) {
    if (typeof alvo.receberDano === 'function') return alvo.receberDano(dano, origem);
    if (typeof alvo.takeDamage === 'function') return alvo.takeDamage(dano, origem);
    if (typeof alvo.hp === 'number') alvo.hp -= dano;
    return dano;
  }

  function empurrar(alvo, ang, forca) {
    if (typeof alvo.x === 'number' && typeof alvo.y === 'number') {
      alvo.x += Math.cos(ang) * forca;
      alvo.y += Math.sin(ang) * forca;
    }
  }

  function contexto(ctx) {
    ctx = ctx || {};
    if (!ctx.inimigos) ctx.inimigos = [];
    if (!ctx.projeteis) ctx.projeteis = [];
    return ctx;
  }

  function sortearPonderado(lista) {
    var total = 0;
    var i;
    for (i = 0; i < lista.length; i++) total += PESOS_RARIDADE[lista[i].raridade] || 1;
    var r = Math.random() * total;
    for (i = 0; i < lista.length; i++) {
      r -= PESOS_RARIDADE[lista[i].raridade] || 1;
      if (r <= 0) return lista[i];
    }
    return lista[lista.length - 1];
  }

  function sortearItem(slot) {
    var lista = GI.listarPorSlot(slot);
    return lista.length ? sortearPonderado(lista).id : null;
  }

  function equipamentoAleatorio() {
    return {
      arma: sortearItem('arma'),
      capacete: Math.random() < 0.6 ? sortearItem('capacete') : null,
      peitoral: sortearItem('peitoral'),
      botas: Math.random() < 0.7 ? sortearItem('botas') : null
    };
  }

  function desenharOrdenado(ctx, lista) {
    var ordenada = [];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i] && !lista[i].morto) ordenada.push(lista[i]);
    }
    ordenada.sort(function (a, b) { return a.y - b.y; });
    for (var j = 0; j < ordenada.length; j++) ordenada[j].draw(ctx);
  }

  class Projectile {
    constructor(o) {
      this.x = o.x;
      this.y = o.y;
      this.ang = o.ang;
      this.vel = o.vel;
      this.dano = o.dano;
      this.raio = o.raio || 4;
      this.alcance = o.alcance;
      this.cor = o.cor;
      this.tipo = o.tipo || 'flecha';
      this.perfura = !!o.perfura;
      this.dono = o.dono || null;
      this.percorrido = 0;
      this.morto = false;
      this.acertados = [];
    }

    update(dt, ctx) {
      if (this.morto) return;
      var passo = this.vel * dt;
      this.x += Math.cos(this.ang) * passo;
      this.y += Math.sin(this.ang) * passo;
      this.percorrido += passo;
      if (this.percorrido >= this.alcance) {
        this.morto = true;
        return;
      }
      if (ctx && ctx.colide && ctx.colide(this.x, this.y, 2)) {
        this.morto = true;
        return;
      }
      var alvos = (ctx && ctx.inimigos) || [];
      for (var i = 0; i < alvos.length; i++) {
        var e = alvos[i];
        if (!vivo(e) || this.acertados.indexOf(e) >= 0) continue;
        if (distancia(this, centroDe(e)) <= this.raio + raioDe(e)) {
          aplicarDano(e, this.dano, this.dono);
          empurrar(e, this.ang, 4);
          this.acertados.push(e);
          if (!this.perfura) {
            this.morto = true;
            break;
          }
        }
      }
    }

    draw(ctx) {
      var x = Math.round(this.x);
      var y = Math.round(this.y);
      ctx.save();
      if (this.tipo === 'magia') {
        ctx.fillStyle = this.cor;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x - 6, y - 6, 12, 12);
        ctx.globalAlpha = 1;
        ctx.fillRect(x - 3, y - 3, 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 1, y - 1, 2, 2);
      } else {
        var c = Math.cos(this.ang);
        var s = Math.sin(this.ang);
        for (var k = 0; k < 4; k++) {
          ctx.fillStyle = k === 0 ? '#ffffff' : (k === 3 ? '#6b4a2a' : this.cor);
          ctx.fillRect(Math.round(this.x - c * k * 3) - 1, Math.round(this.y - s * k * 3) - 1, 3, 3);
        }
      }
      ctx.restore();
    }

    static atualizarTodos(lista, dt, ctx) {
      for (var i = lista.length - 1; i >= 0; i--) {
        lista[i].update(dt, ctx);
        if (lista[i].morto) lista.splice(i, 1);
      }
    }

    static desenharTodos(ctx, lista) {
      for (var i = 0; i < lista.length; i++) lista[i].draw(ctx);
    }
  }

  class Entidade {
    constructor(o) {
      o = o || {};
      this.x = o.x || 0;
      this.y = o.y || 0;
      this.pixel = o.pixel || 3;
      this.raio = o.raio || this.pixel * 3.3;
      this.direcao = 1;
      this.passo = 0;
      this.passoT = 0;
      this.movendo = false;
      this.tempo = 0;
      this.cdAtaque = 0;
      this.invuln = 0;
      this.invulnDuracao = 0.4;
      this.flash = 0;
      this.golpe = null;
      this.efeitos = [];
      this.morto = false;
      this.onMorte = o.onMorte || null;
      this.mostrarBarra = !!o.mostrarBarra;
      this.base = o.base || {};
      this.aparenciaBase = o.aparenciaBase || GI.APARENCIA_BASE;
      this.equipamento = GI.criarEquipamento(o.equipamento);
      this.hp = 0;
      this.hpMax = 0;
      this.recalcular(true);
    }

    recalcular(cheio) {
      var antigo = this.hpMax;
      this.stats = GI.calcularStats(this.equipamento, this.base);
      this.hpMax = this.stats.vida_maxima;
      this.aparencia = GI.calcularAparencia(this.equipamento, this.aparenciaBase);
      if (cheio) {
        this.hp = this.hpMax;
      } else {
        if (this.hpMax > antigo) this.hp += this.hpMax - antigo;
        if (this.hp > this.hpMax) this.hp = this.hpMax;
      }
    }

    equipar(id) {
      if (!GI.obter(id)) return null;
      var anterior = GI.equipar(this.equipamento, id);
      this.recalcular(false);
      return anterior;
    }

    desequipar(slot) {
      var anterior = GI.desequipar(this.equipamento, slot);
      this.recalcular(false);
      return anterior;
    }

    arma() {
      return GI.obter(this.equipamento.arma);
    }

    centro() {
      return { x: this.x, y: this.y - 7 * this.pixel };
    }

    curar(valor) {
      if (this.morto) return;
      this.hp = Math.min(this.hpMax, this.hp + valor);
    }

    receberDano(dano, origem) {
      if (this.morto || this.invuln > 0) return 0;
      var real = GI.calcularDanoRecebido(dano, this.stats.defesa);
      this.hp -= real;
      this.flash = 0.12;
      this.invuln = this.invulnDuracao;
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
      if (this.onMorte) this.onMorte(this, origem);
    }

    danoAtaque(mult) {
      return Math.max(1, Math.round(this.stats.dano * (mult || 1) * rnd(0.9, 1.1)));
    }

    tickBase(dt) {
      this.tempo += dt;
      this.cdAtaque = Math.max(0, this.cdAtaque - dt);
      this.invuln = Math.max(0, this.invuln - dt);
      this.flash = Math.max(0, this.flash - dt);
      if (this.golpe) {
        this.golpe.t += dt;
        if (this.golpe.t >= this.golpe.dur) this.golpe = null;
      }
      for (var i = this.efeitos.length - 1; i >= 0; i--) {
        this.efeitos[i].t += dt;
        if (this.efeitos[i].t >= this.efeitos[i].dur) this.efeitos.splice(i, 1);
      }
      if (this.movendo) {
        this.passoT += dt;
        if (this.passoT > 0.15) {
          this.passoT = 0;
          this.passo++;
        }
      } else {
        this.passo = 0;
        this.passoT = 0;
      }
      this.movendo = false;
    }

    mover(dx, dy, ctx) {
      if (!dx && !dy) return;
      var colide = ctx && ctx.colide;
      var nx = this.x + dx;
      if (!colide || !colide(nx, this.y, this.raio)) this.x = nx;
      var ny = this.y + dy;
      if (!colide || !colide(this.x, ny, this.raio)) this.y = ny;
      var lim = ctx && ctx.limites;
      if (lim) {
        this.x = limitar(this.x, lim.x + this.raio, lim.x + lim.w - this.raio);
        this.y = limitar(this.y, lim.y + this.raio, lim.y + lim.h);
      }
      this.movendo = true;
    }

    atacar(alvo, ctx) {
      if (this.morto || this.cdAtaque > 0) return false;
      ctx = contexto(ctx);
      var c = this.centro();
      var ang = alvo ? Math.atan2(alvo.y - c.y, alvo.x - c.x) : (this.direcao === 1 ? 0 : Math.PI);
      if (alvo) this.direcao = alvo.x >= this.x ? 1 : -1;
      var arma = this.arma();
      var tipo = arma ? arma.tipo : null;
      this.cdAtaque = this.stats.cooldown / 1000;
      if (tipo && RANGED[tipo]) {
        this.disparar(ang, RANGED[tipo], ctx, 1);
      } else {
        this.golpear(ang, ctx, 1);
      }
      return true;
    }

    golpear(ang, ctx, mult) {
      var c = this.centro();
      var arcoRad = this.stats.arco * Math.PI / 180;
      var alcance = this.stats.alcance + this.raio * 0.6;
      var acertos = 0;
      for (var i = 0; i < ctx.inimigos.length; i++) {
        var e = ctx.inimigos[i];
        if (!vivo(e)) continue;
        var ec = centroDe(e);
        var d = distancia(c, ec);
        var r = raioDe(e);
        if (d > alcance + r) continue;
        if (d > r + 4 && Math.abs(angDiff(Math.atan2(ec.y - c.y, ec.x - c.x), ang)) > arcoRad / 2) continue;
        aplicarDano(e, this.danoAtaque(mult), this);
        empurrar(e, ang, 6);
        acertos++;
      }
      this.golpe = {
        t: 0,
        dur: 0.18,
        ang: ang,
        arco: arcoRad,
        alcance: alcance,
        cor: this.aparencia.rastro || '#ffffff'
      };
      return acertos;
    }

    disparar(ang, cfg, ctx, mult) {
      var c = this.centro();
      var arma = this.arma();
      var v = arma && arma.visual;
      var cor = (v && (v.projetil || v.cor_brilho)) || cfg.cor;
      ctx.projeteis.push(new Projectile({
        x: c.x + Math.cos(ang) * 10,
        y: c.y + Math.sin(ang) * 10,
        ang: ang,
        vel: cfg.vel,
        dano: this.danoAtaque(mult),
        alcance: cfg.alcance,
        cor: cor,
        tipo: cfg.tipo,
        perfura: cfg.perfura,
        dono: this
      }));
    }

    areaDano(ctx, c, raio, mult, empurrao, cor) {
      for (var i = 0; i < ctx.inimigos.length; i++) {
        var e = ctx.inimigos[i];
        if (!vivo(e)) continue;
        var ec = centroDe(e);
        if (distancia(c, ec) <= raio + raioDe(e)) {
          aplicarDano(e, this.danoAtaque(mult), this);
          empurrar(e, Math.atan2(ec.y - c.y, ec.x - c.x), empurrao);
        }
      }
      this.efeitos.push({ tipo: 'anel', t: 0, dur: 0.4, r: raio, cor: cor });
    }

    desenharGolpe(ctx) {
      var g = this.golpe;
      if (!g) return;
      var c = this.centro();
      var k = g.t / g.dur;
      var ini = g.ang - g.arco / 2;
      var passos = 7;
      var tam = Math.max(2, Math.round(this.pixel));
      ctx.save();
      ctx.fillStyle = g.cor;
      ctx.globalAlpha = 1 - k * 0.7;
      for (var i = 0; i <= passos; i++) {
        var a = ini + (g.arco * k) * (i / passos);
        ctx.fillRect(Math.round(c.x + Math.cos(a) * g.alcance - tam / 2), Math.round(c.y + Math.sin(a) * g.alcance - tam / 2), tam, tam);
      }
      ctx.restore();
    }

    desenharEfeitos(ctx) {
      if (!this.efeitos.length) return;
      var c = this.centro();
      ctx.save();
      for (var i = 0; i < this.efeitos.length; i++) {
        var f = this.efeitos[i];
        if (f.tipo !== 'anel') continue;
        var k = f.t / f.dur;
        var r = f.r * k;
        var n = Math.max(12, Math.round(r / 3));
        ctx.fillStyle = f.cor;
        ctx.globalAlpha = 1 - k;
        for (var j = 0; j < n; j++) {
          var a = (j / n) * TAU;
          ctx.fillRect(Math.round(c.x + Math.cos(a) * r - 1.5), Math.round(c.y + Math.sin(a) * r - 1.5), 3, 3);
        }
      }
      ctx.restore();
    }

    desenharBarra(ctx) {
      if (!this.mostrarBarra && this.hp >= this.hpMax) return;
      var p = this.pixel;
      var larg = Math.round(7 * p);
      var x = Math.round(this.x - larg / 2);
      var y = Math.round(this.y - 15 * p - 7);
      var razao = limitar(this.hp / this.hpMax, 0, 1);
      ctx.save();
      ctx.fillStyle = '#14141c';
      ctx.fillRect(x - 1, y - 1, larg + 2, 5);
      ctx.fillStyle = razao > 0.5 ? '#4cd04c' : (razao > 0.25 ? '#e0c030' : '#e04040');
      ctx.fillRect(x, y, Math.round(larg * razao), 3);
      ctx.restore();
    }

    draw(ctx) {
      if (this.morto) return;
      var p = this.pixel;
      var px = Math.round(this.x - 3.5 * p);
      var py = Math.round(this.y - 15 * p);
      ctx.save();
      if (this.invuln > 0 && Math.floor(this.tempo * 24) % 2 === 0) ctx.globalAlpha = 0.55;
      GI.desenharPersonagem(ctx, px, py, this.equipamento, {
        pixel: p,
        direcao: this.direcao,
        passo: this.passo,
        tempo: this.tempo * 1000,
        aparencia: this.aparencia
      });
      if (this.flash > 0) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ff3030';
        ctx.fillRect(px + p, py + p, 5 * p, 12 * p);
      }
      ctx.restore();
      this.desenharEfeitos(ctx);
      this.desenharGolpe(ctx);
      this.desenharBarra(ctx);
    }
  }

  class Player extends Entidade {
    constructor(o) {
      o = o || {};
      var aleatorio = o.classe === 'aleatorio' || o.aleatorio === true;
      var id = aleatorio ? escolher(Object.keys(CLASSES)) : (CLASSES[o.classe] ? o.classe : 'cavaleiro');
      var cfg = CLASSES[id];
      var aparencia = copiar(cfg.aparencia);
      var equip = copiar(cfg.equipamento);
      if (aleatorio) {
        equip = equipamentoAleatorio();
        aparencia.pele = escolher(CORES_PELE);
        aparencia.cabelo = escolher(CORES_CABELO);
      }
      super({
        x: o.x,
        y: o.y,
        pixel: 3,
        base: copiar(cfg.base),
        aparenciaBase: aparencia,
        equipamento: equip,
        onMorte: o.onMorte
      });
      this.classe = id;
      this.config = cfg;
      this.nome = o.nome || cfg.nome;
      this.modoAleatorio = aleatorio;
      this.ouro = o.ouro || 0;
      this.inventario = [];
      this.cdHabilidade = 0;
      this.escudoT = 0;
      this.furiaT = 0;
      this.invulnDuracao = 0.6;
      this.ajudantes = new CompanionSquad(this);
    }

    equipar(id) {
      if (!GI.obter(id)) return null;
      var i = this.inventario.indexOf(id);
      if (i >= 0) this.inventario.splice(i, 1);
      var anterior = super.equipar(id);
      if (anterior) this.inventario.push(anterior);
      return anterior;
    }

    comprar(id) {
      var item = GI.obter(id);
      if (!item || this.ouro < item.preco) return false;
      this.ouro -= item.preco;
      this.inventario.push(id);
      return true;
    }

    entregarAoAjudante(indice, id) {
      var c = this.ajudantes.membros[indice];
      var i = this.inventario.indexOf(id);
      if (!c || i < 0 || !GI.obter(id)) return false;
      this.inventario.splice(i, 1);
      var anterior = c.equipar(id);
      if (anterior) this.inventario.push(anterior);
      return true;
    }

    receberDano(dano, origem) {
      if (this.escudoT > 0) dano = dano * 0.3;
      return super.receberDano(dano, origem);
    }

    danoAtaque(mult) {
      return super.danoAtaque((mult || 1) * (this.furiaT > 0 ? 1.6 : 1));
    }

    atacar(alvo, ctx) {
      var ok = super.atacar(alvo, ctx);
      if (ok && this.furiaT > 0) this.cdAtaque *= 0.6;
      return ok;
    }

    usarHabilidade(alvo, ctx) {
      if (this.morto || this.cdHabilidade > 0) return false;
      ctx = contexto(ctx);
      var h = this.config.habilidade;
      var c = this.centro();
      var ang = alvo ? Math.atan2(alvo.y - c.y, alvo.x - c.x) : (this.direcao === 1 ? 0 : Math.PI);
      if (h.tipo === 'nova') {
        this.areaDano(ctx, c, 96, 2.5, 10, '#b05cff');
      } else if (h.tipo === 'escudo') {
        this.escudoT = 2.2;
      } else if (h.tipo === 'rajada') {
        for (var i = -2; i <= 2; i++) this.disparar(ang + i * 0.16, RANGED.arco, ctx, 0.8);
      } else if (h.tipo === 'impacto') {
        this.areaDano(ctx, c, 72, 2, 22, '#ffb020');
      } else if (h.tipo === 'furia') {
        this.furiaT = h.duracao || 5;
        this.efeitos.push({ tipo: 'anel', t: 0, dur: 0.4, r: 40, cor: '#ff4a1a' });
      }
      this.cdHabilidade = h.recarga;
      return true;
    }

    update(dt, input, ctx) {
      if (this.morto) return;
      ctx = contexto(ctx);
      input = input || {};
      this.tickBase(dt);
      this.cdHabilidade = Math.max(0, this.cdHabilidade - dt);
      this.escudoT = Math.max(0, this.escudoT - dt);
      this.furiaT = Math.max(0, this.furiaT - dt);
      var dx = input.dx || 0;
      var dy = input.dy || 0;
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        var v = this.stats.velocidade * BASE_VEL;
        this.mover(dx / len * v * dt, dy / len * v * dt, ctx);
      }
      if (input.alvo) {
        this.direcao = input.alvo.x >= this.x ? 1 : -1;
      } else if (dx !== 0) {
        this.direcao = dx > 0 ? 1 : -1;
      }
      if (input.atacar) this.atacar(input.alvo, ctx);
      if (input.habilidade) this.usarHabilidade(input.alvo, ctx);
      this.ajudantes.update(dt, ctx);
    }

    desenharBarba(ctx) {
      var p = this.pixel;
      var px = Math.round(this.x - 3.5 * p);
      var py = Math.round(this.y - 15 * p);
      var cor = this.aparenciaBase.cabelo;
      var sombra = '#000000';
      ctx.save();
      if (this.invuln > 0 && Math.floor(this.tempo * 24) % 2 === 0) ctx.globalAlpha = 0.55;
      ctx.fillStyle = cor;
      ctx.fillRect(px + p, py + 5 * p, 5 * p, p);
      ctx.fillRect(px + 2 * p, py + 6 * p, 3 * p, p);
      ctx.fillRect(px + 3 * p, py + 7 * p, p, p);
      ctx.fillStyle = sombra;
      ctx.globalAlpha = ctx.globalAlpha * 0.25;
      ctx.fillRect(px + 2 * p, py + 6 * p + p - Math.max(1, Math.round(p / 3)), 3 * p, Math.max(1, Math.round(p / 3)));
      ctx.restore();
    }

    draw(ctx) {
      if (this.morto) return;
      super.draw(ctx);
      if (this.config.barba) this.desenharBarba(ctx);
      if (this.furiaT > 0) {
        var cf = this.centro();
        ctx.save();
        ctx.fillStyle = '#ff4a1a';
        ctx.globalAlpha = 0.5;
        for (var q = 0; q < 6; q++) {
          var ang = this.tempo * 5 + q * (TAU / 6);
          ctx.fillRect(Math.round(cf.x + Math.cos(ang) * 16 - 1.5), Math.round(cf.y + Math.sin(ang) * 20 - 1.5), 3, 3);
        }
        ctx.restore();
      }
      if (this.escudoT > 0) {
        var c = this.centro();
        var r = 18 + Math.sin(this.tempo * 10) * 1.5;
        ctx.save();
        ctx.fillStyle = '#7fb2ff';
        ctx.globalAlpha = 0.55;
        for (var j = 0; j < 20; j++) {
          var a = (j / 20) * TAU;
          ctx.fillRect(Math.round(c.x + Math.cos(a) * r - 1.5), Math.round(c.y + Math.sin(a) * r - 1.5), 3, 3);
        }
        ctx.restore();
      }
    }

    desenharComAjudantes(ctx) {
      desenharOrdenado(ctx, [this].concat(this.ajudantes.membros));
    }
  }

  class Companion extends Entidade {
    constructor(o) {
      o = o || {};
      var indice = o.indice || 0;
      var paleta = copiar(PALETAS_AJUDANTE[indice % PALETAS_AJUDANTE.length]);
      var marca = paleta.marca;
      delete paleta.marca;
      var equip = o.aleatorio ? equipamentoAleatorio() : (o.equipamento || { arma: 'espada_enferrujada', peitoral: 'peitoral_tecido' });
      super({
        x: o.x,
        y: o.y,
        pixel: 2,
        base: { dano: 1, defesa: 0, vida_maxima: 50, velocidade: 0.95 },
        aparenciaBase: paleta,
        equipamento: equip,
        mostrarBarra: true,
        onMorte: o.onMorte
      });
      this.indice = indice;
      this.marca = marca;
      this.nome = o.nome || ('Ajudante ' + (indice + 1));
      this.dono = o.dono || null;
      this.grupo = null;
      this.invulnDuracao = 0.3;
    }

    morrer(origem) {
      if (this.morto) return;
      this.morto = true;
      var grupo = this.grupo;
      if (grupo) grupo.remover(this);
      if (this.onMorte) this.onMorte(this, origem);
      if (grupo && grupo.onMorte) grupo.onMorte(this, origem);
    }

    escolherAlvo(ctx) {
      var melhor = null;
      var menor = 190;
      for (var i = 0; i < ctx.inimigos.length; i++) {
        var e = ctx.inimigos[i];
        if (!vivo(e)) continue;
        var ec = centroDe(e);
        var d = distancia(this, ec);
        if (d >= menor) continue;
        if (this.dono && distancia(this.dono, ec) > 320) continue;
        menor = d;
        melhor = e;
      }
      return melhor;
    }

    update(dt, ctx) {
      if (this.morto) return;
      ctx = contexto(ctx);
      this.tickBase(dt);
      var dono = this.dono;
      var c = this.centro();
      var vel = this.stats.velocidade * BASE_VEL;
      var distDono = dono ? distancia(this, dono) : 0;
      var alvo = this.escolherAlvo(ctx);

      if (dono && distDono > 360) {
        this.x = dono.x + rnd(-20, 20);
        this.y = dono.y + rnd(-10, 10);
        return;
      }

      if (alvo) {
        var ec = centroDe(alvo);
        var d = distancia(c, ec) || 1;
        var arma = this.arma();
        var cfg = arma ? RANGED[arma.tipo] : null;
        var alcance = cfg ? cfg.alcance * 0.7 : this.stats.alcance + raioDe(alvo) + this.raio * 0.4;
        var ux = (ec.x - c.x) / d;
        var uy = (ec.y - c.y) / d;
        if (d > alcance) {
          this.mover(ux * vel * dt, uy * vel * dt, ctx);
        } else if (cfg && d < alcance * 0.35) {
          this.mover(-ux * vel * 0.8 * dt, -uy * vel * 0.8 * dt, ctx);
        }
        this.direcao = ec.x >= c.x ? 1 : -1;
        if (d <= alcance + 4) this.atacar(ec, ctx);
      } else if (dono) {
        var base = dono.direcao === 1 ? Math.PI : 0;
        var a = base + (this.indice - 1) * 0.9;
        var dx = dono.x + Math.cos(a) * 30 - this.x;
        var dy = dono.y + Math.sin(a) * 16 - this.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 8) {
          var v = vel * (distDono > 140 ? 1.6 : 1);
          this.mover(dx / dist * v * dt, dy / dist * v * dt, ctx);
          if (Math.abs(dx) > 2) this.direcao = dx > 0 ? 1 : -1;
        } else {
          this.direcao = dono.direcao;
        }
      }
    }

    draw(ctx) {
      if (this.morto) return;
      super.draw(ctx);
      var x = Math.round(this.x);
      var y = Math.round(this.y - 15 * this.pixel - 14);
      ctx.save();
      ctx.fillStyle = this.marca;
      ctx.fillRect(x - 1, y, 3, 3);
      ctx.fillRect(x - 2, y - 1, 5, 1);
      ctx.fillRect(x, y + 3, 1, 1);
      ctx.restore();
    }
  }

  Companion.MAX = 3;

  class CompanionSquad {
    constructor(dono) {
      this.dono = dono || null;
      this.membros = [];
      this.onMorte = null;
    }

    get quantidade() {
      return this.membros.length;
    }

    get cheio() {
      return this.membros.length >= Companion.MAX;
    }

    proximoIndice() {
      for (var i = 0; i < Companion.MAX; i++) {
        var ocupado = false;
        for (var j = 0; j < this.membros.length; j++) {
          if (this.membros[j].indice === i) ocupado = true;
        }
        if (!ocupado) return i;
      }
      return -1;
    }

    adicionar(o) {
      if (this.cheio) return null;
      o = o || {};
      var indice = this.proximoIndice();
      var dono = this.dono;
      var c = new Companion({
        indice: indice,
        dono: dono,
        nome: o.nome,
        equipamento: o.equipamento,
        aleatorio: o.aleatorio,
        x: o.x !== undefined ? o.x : (dono ? dono.x - 20 : 0),
        y: o.y !== undefined ? o.y : (dono ? dono.y : 0),
        onMorte: o.onMorte
      });
      c.grupo = this;
      this.membros.push(c);
      return c;
    }

    remover(c) {
      var i = this.membros.indexOf(c);
      if (i >= 0) this.membros.splice(i, 1);
      c.grupo = null;
    }

    equipar(alvo, id) {
      var c = typeof alvo === 'number' ? this.membros[alvo] : alvo;
      if (!c || this.membros.indexOf(c) < 0) return null;
      return c.equipar(id);
    }

    danificar(c, dano, origem) {
      return c.receberDano(dano, origem);
    }

    limpar() {
      this.membros.length = 0;
    }

    update(dt, ctx) {
      var copia = this.membros.slice();
      for (var i = 0; i < copia.length; i++) {
        if (!copia[i].morto) copia[i].update(dt, ctx);
      }
    }

    draw(ctx) {
      desenharOrdenado(ctx, this.membros);
    }
  }

  class Controles {
    constructor(canvas) {
      var self = this;
      this.canvas = canvas;
      this.teclas = {};
      this.mouse = { x: 0, y: 0, baixo: false, ativo: false };
      this.aoPressionar = function (e) {
        var k = e.key.toLowerCase();
        self.teclas[k] = true;
        if (k === ' ' || k.indexOf('arrow') === 0) e.preventDefault();
      };
      this.aoSoltar = function (e) {
        self.teclas[e.key.toLowerCase()] = false;
      };
      this.aoMover = function (e) {
        var r = canvas.getBoundingClientRect();
        self.mouse.x = (e.clientX - r.left) * canvas.width / r.width;
        self.mouse.y = (e.clientY - r.top) * canvas.height / r.height;
        self.mouse.ativo = true;
      };
      this.aoClicar = function (e) {
        if (e.button === 0) self.mouse.baixo = true;
      };
      this.aoLiberar = function (e) {
        if (e.button === 0) self.mouse.baixo = false;
      };
      global.addEventListener('keydown', this.aoPressionar);
      global.addEventListener('keyup', this.aoSoltar);
      canvas.addEventListener('mousemove', this.aoMover);
      canvas.addEventListener('mousedown', this.aoClicar);
      global.addEventListener('mouseup', this.aoLiberar);
    }

    ler(camera) {
      var t = this.teclas;
      var cx = camera ? camera.x : 0;
      var cy = camera ? camera.y : 0;
      return {
        dx: ((t['d'] || t['arrowright']) ? 1 : 0) - ((t['a'] || t['arrowleft']) ? 1 : 0),
        dy: ((t['s'] || t['arrowdown']) ? 1 : 0) - ((t['w'] || t['arrowup']) ? 1 : 0),
        atacar: !!(this.mouse.baixo || t[' '] || t['j']),
        habilidade: !!(t['q'] || t['k']),
        alvo: this.mouse.ativo ? { x: this.mouse.x + cx, y: this.mouse.y + cy } : null
      };
    }

    destruir() {
      global.removeEventListener('keydown', this.aoPressionar);
      global.removeEventListener('keyup', this.aoSoltar);
      this.canvas.removeEventListener('mousemove', this.aoMover);
      this.canvas.removeEventListener('mousedown', this.aoClicar);
      global.removeEventListener('mouseup', this.aoLiberar);
    }
  }

  global.GameEntities = {
    CLASSES: CLASSES,
    RANGED: RANGED,
    Entidade: Entidade,
    Player: Player,
    Companion: Companion,
    CompanionSquad: CompanionSquad,
    Projectile: Projectile,
    Controles: Controles,
    equipamentoAleatorio: equipamentoAleatorio,
    desenharOrdenado: desenharOrdenado
  };
})(window);
