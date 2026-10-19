(function (global) {
  'use strict';

  var ac = null;
  var mestre = null;
  var barramentoMusica = null;
  var mudo = false;
  var ultimo = {};
  var musica = { timer: null, bioma: null, chefe: false, passo: 0, proximo: 0 };

  var MUSICAS = {
    floresta: { raiz: 110, escala: [0, 3, 5, 7, 10, 12], bpm: 96, onda: 'triangle' },
    cripta: { raiz: 98, escala: [0, 1, 5, 7, 8, 12], bpm: 80, onda: 'square' },
    pantano: { raiz: 103.8, escala: [0, 2, 4, 6, 8, 10], bpm: 72, onda: 'sine' },
    vulcao: { raiz: 87.3, escala: [0, 3, 5, 6, 7, 10], bpm: 128, onda: 'sawtooth' },
    vazio: { raiz: 82.4, escala: [0, 1, 6, 7, 11, 13], bpm: 104, onda: 'square' }
  };

  function garantir() {
    if (ac) return ac;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    try {
      ac = new AC();
    } catch (e) {
      ac = null;
      return null;
    }
    mestre = ac.createGain();
    mestre.gain.value = mudo ? 0 : 1;
    mestre.connect(ac.destination);
    barramentoMusica = ac.createGain();
    barramentoMusica.gain.value = 0.7;
    barramentoMusica.connect(mestre);
    return ac;
  }

  function retomar() {
    var a = garantir();
    if (a && a.state === 'suspended') a.resume();
  }

  function nota(freq, dur, tipo, vol, t0, slide, destino) {
    var osc = ac.createOscillator();
    var g = ac.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(destino || mestre);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function ruido(dur, vol, t0, freq) {
    var n = Math.floor(ac.sampleRate * dur);
    var buf = ac.createBuffer(1, n, ac.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ac.createBufferSource();
    src.buffer = buf;
    var filtro = ac.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = freq || 2000;
    var g = ac.createGain();
    g.gain.value = vol;
    src.connect(filtro);
    filtro.connect(g);
    g.connect(mestre);
    src.start(t0);
  }

  var SONS = {
    golpe: function (t) {
      ruido(0.09, 0.3, t, 2600);
      nota(260, 0.08, 'square', 0.1, t, 110);
    },
    tiro: function (t) {
      nota(700, 0.1, 'triangle', 0.14, t, 220);
    },
    habilidade: function (t) {
      nota(180, 0.35, 'sawtooth', 0.16, t, 720);
      ruido(0.3, 0.2, t, 1400);
    },
    dano: function (t) {
      ruido(0.15, 0.4, t, 900);
      nota(150, 0.15, 'square', 0.18, t, 60);
    },
    morte: function (t) {
      nota(320, 0.12, 'square', 0.1, t, 90);
    },
    moeda: function (t) {
      nota(988, 0.06, 'square', 0.1, t);
      nota(1319, 0.12, 'square', 0.1, t + 0.06);
    },
    carta: function (t) {
      nota(523, 0.1, 'triangle', 0.18, t);
      nota(659, 0.1, 'triangle', 0.18, t + 0.08);
      nota(784, 0.18, 'triangle', 0.18, t + 0.16);
    },
    compra: function (t) {
      nota(660, 0.07, 'square', 0.12, t);
      nota(880, 0.12, 'square', 0.12, t + 0.07);
    },
    erro: function (t) {
      nota(140, 0.2, 'square', 0.14, t, 90);
    },
    clique: function (t) {
      nota(520, 0.04, 'square', 0.08, t);
    },
    nivel: function (t) {
      [392, 523, 659, 784].forEach(function (f, i) { nota(f, 0.14, 'square', 0.12, t + i * 0.09); });
    },
    onda: function (t) {
      nota(110, 0.5, 'sawtooth', 0.18, t, 70);
      nota(113, 0.5, 'sawtooth', 0.14, t, 72);
    },
    boss: function (t) {
      nota(82, 0.9, 'sawtooth', 0.22, t, 55);
      nota(87, 0.9, 'square', 0.12, t + 0.05, 58);
      ruido(0.6, 0.25, t, 500);
    },
    perda: function (t) {
      nota(330, 0.2, 'triangle', 0.16, t, 200);
      nota(247, 0.3, 'triangle', 0.16, t + 0.18, 120);
    },
    derrota: function (t) {
      [392, 330, 262, 196].forEach(function (f, i) { nota(f, 0.3, 'triangle', 0.2, t + i * 0.25, f * 0.9); });
    },
    vitoria: function (t) {
      [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { nota(f, 0.2, 'square', 0.14, t + i * 0.13); });
    }
  };

  function tocar(nome) {
    if (mudo) return;
    var a = garantir();
    if (!a) return;
    if (a.state !== 'running') {
      a.resume();
      return;
    }
    var agora = global.performance.now();
    if (ultimo[nome] && agora - ultimo[nome] < 45) return;
    ultimo[nome] = agora;
    if (SONS[nome]) SONS[nome](a.currentTime);
  }

  function agendar() {
    if (!ac || !musica.bioma) return;
    var m = MUSICAS[musica.bioma] || MUSICAS.floresta;
    var bpm = musica.chefe ? m.bpm * 1.3 : m.bpm;
    var dur = 60 / bpm / 2;
    if (musica.proximo < ac.currentTime) musica.proximo = ac.currentTime + 0.05;
    while (musica.proximo < ac.currentTime + 0.4) {
      var t = musica.proximo;
      var p = musica.passo;
      if (p % 4 === 0) nota(m.raiz, dur * 3.6, 'triangle', 0.09, t, null, barramentoMusica);
      if (musica.chefe && p % 2 === 1) nota(m.raiz * 0.5, dur * 0.8, 'square', 0.04, t, null, barramentoMusica);
      var idx = (p * 3 + (p >> 2) * 2) % m.escala.length;
      if (p % 2 === 0 || Math.random() < 0.35) {
        nota(m.raiz * 2 * Math.pow(2, m.escala[idx] / 12), dur * 0.9, musica.chefe ? 'square' : m.onda, 0.035, t, null, barramentoMusica);
      }
      musica.passo++;
      musica.proximo += dur;
    }
  }

  function iniciarMusica(bioma, chefe) {
    var a = garantir();
    if (!a) return;
    if (musica.bioma === bioma && musica.chefe === !!chefe && musica.timer) return;
    pararMusica();
    musica.bioma = bioma;
    musica.chefe = !!chefe;
    musica.passo = 0;
    musica.proximo = a.currentTime + 0.1;
    musica.timer = global.setInterval(agendar, 100);
  }

  function pararMusica() {
    if (musica.timer) global.clearInterval(musica.timer);
    musica.timer = null;
    musica.bioma = null;
  }

  function definirMudo(v) {
    mudo = !!v;
    if (mestre) mestre.gain.value = mudo ? 0 : 1;
  }

  global.GameAudio = {
    tocar: tocar,
    retomar: retomar,
    musica: iniciarMusica,
    pararMusica: pararMusica,
    definirMudo: definirMudo,
    alternarMudo: function () {
      definirMudo(!mudo);
      return mudo;
    },
    get mudo() {
      return mudo;
    }
  };
})(window);
