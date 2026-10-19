(function (global) {
  'use strict';

  var LARG = 960;
  var ALT = 640;
  var REQUERIDOS = ['GameItems', 'GameEntities', 'GameWorld', 'GameCards', 'GameAudio', 'GameUI'];

  function iniciar() {
    var canvas = global.document.getElementById('jogo');
    var ctx = canvas.getContext('2d');
    canvas.width = LARG;
    canvas.height = ALT;

    var faltando = REQUERIDOS.filter(function (n) { return !global[n]; });
    if (faltando.length) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, LARG, ALT);
      ctx.fillStyle = '#ff6060';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Módulos não carregados:', LARG / 2, ALT / 2 - 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(faltando.join(', '), LARG / 2, ALT / 2 + 16);
      return;
    }

    var GE = global.GameEntities;
    var GW = global.GameWorld;
    var GC = global.GameCards;
    var audio = global.GameAudio;
    var UI = global.GameUI;

    var ui = new UI.Interface(canvas);
    var toque = new UI.ControlesToque(canvas);
    var controles = new GE.Controles(canvas);
    var menu = new UI.Menu();
    var hud = new UI.HUD();
    var loja = new UI.Loja();
    var telaFinal = new UI.TelaFinal();

    var estado = 'menu';
    var jogador = null;
    var campanha = null;
    var draft = null;
    var tempoRun = 0;
    var timerFim = 0;
    var ultimoMundo = 0;
    var prev = { cd: 0, hab: 0, hp: 0, ouro: 0, abates: 0, aj: 0 };
    var infoMenu = { melhor: new GW.Campanha({}).carregar() };
    var ultimo = global.performance.now();

    function aoEvento(tipo, dados) {
      if (tipo === 'nivel_iniciado') {
        var bioma = GW.BIOMAS[(dados.mundo > GW.MUNDOS ? GW.MUNDOS : dados.mundo - 1)];
        audio.musica(bioma.id, dados.boss);
        if (dados.boss) audio.tocar('boss');
        prev.abates = 0;
        if (dados.mundo !== ultimoMundo && dados.mundo > 1) hud.toast('Novo mundo: ' + bioma.nome, '#ffd23f');
        ultimoMundo = dados.mundo;
      } else if (tipo === 'nivel_completo') {
        audio.tocar('nivel');
      } else if (tipo === 'boss_derrotado') {
        audio.tocar('vitoria');
        hud.toast(dados.nome + ' derrotado!', '#ffd23f');
      } else if (tipo === 'onda') {
        audio.tocar('onda');
      } else if (tipo === 'mundo_completo') {
        hud.toast('Mundo ' + dados.mundo + ' concluído!', '#7aff9a');
      } else if (tipo === 'derrota') {
        audio.pararMusica();
        audio.tocar('derrota');
        timerFim = 0;
      } else if (tipo === 'vitoria') {
        audio.pararMusica();
        audio.tocar('vitoria');
        timerFim = 0;
      }
    }

    function iniciarRun(classe, continuar) {
      if (draft) draft.desligar();
      hud.limpar();
      jogador = new GE.Player({ classe: classe, x: LARG / 2, y: ALT - 80 });
      campanha = new GW.Campanha({ largura: LARG, altura: ALT, aoEvento: aoEvento });
      var melhor = campanha.carregar();
      draft = new GC.Draft({
        jogador: jogador,
        campanha: campanha,
        aoEscolher: function (carta, mensagem) {
          audio.tocar('carta');
          hud.toast(carta.nome + (mensagem ? ': ' + mensagem : ''), '#ffffff');
        },
        aoFechar: function () {
          estado = 'loja';
          loja.abrir(jogador, campanha.nivelGlobal, hud, function () {
            estado = 'jogando';
          });
        }
      });
      draft.ligar(canvas);
      draft.vincularCampanha(campanha, jogador);
      var inicio = continuar ? melhor : { mundo: 1, sub: 1 };
      if (continuar) jogador.ouro = 30 * ((inicio.mundo - 1) * GW.SUBNIVEIS + inicio.sub - 1);
      tempoRun = 0;
      timerFim = 0;
      ultimoMundo = 0;
      prev = { cd: 0, hab: 0, hp: jogador.hp, ouro: jogador.ouro || 0, abates: 0, aj: jogador.ajudantes.quantidade };
      campanha.iniciar(jogador, inicio);
      estado = 'jogando';
    }

    function inimigoMaisProximo() {
      var arena = campanha.arena;
      var c0 = jogador.centro();
      var melhor = null;
      var menor = Infinity;
      for (var i = 0; i < arena.criaturas.length; i++) {
        var c = arena.criaturas[i];
        if (c.morto) continue;
        var cc = c.centro();
        var d = (cc.x - c0.x) * (cc.x - c0.x) + (cc.y - c0.y) * (cc.y - c0.y);
        if (d < menor) {
          menor = d;
          melhor = cc;
        }
      }
      return melhor;
    }

    function lerEntrada() {
      var a = controles.ler(null);
      var t = toque.ler();
      var dx = a.dx;
      var dy = a.dy;
      if (t.dx || t.dy) {
        dx = t.dx;
        dy = t.dy;
      }
      var alvo = a.alvo;
      if (t.atacar) alvo = inimigoMaisProximo();
      return { dx: dx, dy: dy, atacar: a.atacar || t.atacar, habilidade: a.habilidade || t.habilidade, alvo: alvo };
    }

    function sons() {
      var arma = jogador.arma();
      if (jogador.cdAtaque > prev.cd + 0.01) {
        audio.tocar(arma && (arma.tipo === 'arco' || arma.tipo === 'cajado') ? 'tiro' : 'golpe');
      }
      if (jogador.cdHabilidade > prev.hab + 0.01) audio.tocar('habilidade');
      if (jogador.hp < prev.hp) audio.tocar('dano');
      if ((jogador.ouro || 0) > prev.ouro) audio.tocar('moeda');
      if (campanha.arena && campanha.arena.abates > prev.abates) audio.tocar('morte');
      if (jogador.ajudantes.quantidade < prev.aj) audio.tocar('perda');
      prev.cd = jogador.cdAtaque;
      prev.hab = jogador.cdHabilidade;
      prev.hp = jogador.hp;
      prev.ouro = jogador.ouro || 0;
      prev.abates = campanha.arena ? campanha.arena.abates : 0;
      prev.aj = jogador.ajudantes.quantidade;
    }

    function formatarTempo(s) {
      var m = Math.floor(s / 60);
      var r = Math.floor(s % 60);
      return m + ':' + (r < 10 ? '0' : '') + r;
    }

    function dadosFim() {
      return {
        classe: jogador.config.nome + (jogador.modoAleatorio ? ' (aleatório)' : ''),
        nivel: campanha.nivelGlobal,
        total: GW.NIVEL_FINAL,
        ouro: jogador.ouro || 0,
        cartas: jogador.cartas ? jogador.cartas.length : 0,
        ajudantes: jogador.ajudantes.quantidade,
        tempo: formatarTempo(tempoRun)
      };
    }

    function atualizar(dt) {
      if (estado === 'jogando') {
        if (ui.tecla('p') || ui.tecla('escape')) {
          estado = 'pausa';
          toque.liberar();
          return;
        }
        if (draft.aberto) {
          estado = 'draft';
          toque.liberar();
          return;
        }
        tempoRun += dt;
        jogador.update(dt, lerEntrada(), campanha.contexto());
        campanha.update(dt);
        sons();
        if (campanha.estado === 'derrota' || campanha.estado === 'vitoria') {
          timerFim += dt;
          if (timerFim > 1.6) estado = campanha.estado;
        }
        if (draft.aberto) estado = 'draft';
      } else if (estado === 'draft') {
        draft.update(dt);
      } else if (estado === 'pausa') {
        if (ui.tecla('p') || ui.tecla('escape')) estado = 'jogando';
      }
      if (ui.tecla('m')) audio.alternarMudo();
    }

    function desenharMundo() {
      campanha.draw(ctx);
      campanha.desenharHUD(ctx);
      hud.desenhar(ctx, 0.016, jogador, campanha);
    }

    function desenhar(dt) {
      toque.habilitado = estado === 'jogando';
      if (estado === 'menu') {
        var r = menu.desenhar(ctx, dt, ui, infoMenu, audio);
        if (r) {
          audio.retomar();
          iniciarRun(r.classe, r.continuar);
        }
        return;
      }
      if (estado === 'jogando' || estado === 'draft') {
        campanha.draw(ctx);
        campanha.desenharHUD(ctx);
        hud.desenhar(ctx, dt, jogador, campanha);
        toque.desenhar(ctx);
        if (estado === 'draft') draft.draw(ctx);
        return;
      }
      if (estado === 'loja') {
        campanha.draw(ctx);
        loja.desenhar(ctx, ui, audio);
        hud.desenhar(ctx, dt, jogador, campanha);
        return;
      }
      if (estado === 'pausa') {
        desenharMundo();
        ctx.fillStyle = 'rgba(5,4,10,0.7)';
        ctx.fillRect(0, 0, LARG, ALT);
        UI.texto(ctx, 'PAUSA', LARG / 2, 250, '#ffffff', 48, 'center');
        if (ui.botao(ctx, LARG / 2 - 110, 290, 220, 46, 'CONTINUAR', { cor: '#2f9a4a' })) estado = 'jogando';
        if (ui.botao(ctx, LARG / 2 - 110, 346, 220, 46, 'MENU PRINCIPAL', { cor: '#a63a4a' })) voltarAoMenu();
        return;
      }
      if (estado === 'derrota' || estado === 'vitoria') {
        desenharMundo();
        var acao = telaFinal.desenhar(ctx, ui, estado, dadosFim(), audio);
        if (acao === 'menu') voltarAoMenu();
      }
    }

    function voltarAoMenu() {
      if (draft) {
        draft.desligar();
        draft = null;
      }
      audio.pararMusica();
      infoMenu.melhor = new GW.Campanha({}).carregar();
      estado = 'menu';
    }

    function quadro(agora) {
      var dt = Math.min(0.05, (agora - ultimo) / 1000);
      ultimo = agora;
      atualizar(dt);
      desenhar(dt);
      ui.fimQuadro();
      global.requestAnimationFrame(quadro);
    }

    var desbloquear = function () {
      audio.retomar();
    };
    canvas.addEventListener('pointerdown', desbloquear);
    global.addEventListener('keydown', desbloquear);
    canvas.focus();
    global.requestAnimationFrame(quadro);

    global.GameMain = {
      estado: function () { return estado; },
      jogador: function () { return jogador; },
      campanha: function () { return campanha; },
      iniciarRun: iniciarRun
    };
  }

  if (global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})(window);
