/* Toca a trilha (src/musica-dados.js) com Web Audio: osciladores e ruído, sem arquivo de áudio.
   music.play('mapa') troca a música de fundo (em loop); music.sfx('acerto') toca uma vinheta
   por cima, abaixando a música enquanto ela soa. O som liga ou desliga no botão do topo. */
const music = (() => {
  const KEY = 'gta-glicerio-som';
  let enabled = true;
  try { enabled = localStorage.getItem(KEY) !== '0'; } catch (e) { /* armazenamento indisponível */ }
  let ctx = null, master, musicBus, sfxBus, noise;
  let current = null, wanted = null, timer = null;

  // Cada faixa vira uma lista de eventos com instante em semicolcheias
  const compiled = {};
  function compile(name) {
    if (compiled[name]) return compiled[name];
    const song = SONGS[name];
    const events = [];
    let length = 0;
    song.tracks.forEach(track => {
      const parsed = parseNotes(track.notes);
      length = Math.max(length, parsed.length);
      parsed.events.forEach(ev => events.push({ ...ev, inst: track.inst }));
    });
    Object.entries(song.drums || {}).forEach(([piece, line]) => {
      for (let step = 0; step < length; step += 1) if (line[step % line.length] === 'x') events.push({ step, dur: 1, inst: piece });
    });
    events.sort((a, b) => a.step - b.step);
    return (compiled[name] = { events, length, stepDur: 60 / song.bpm / 4, loop: !!song.loop });
  }

  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return true;
  }

  const freq = midi => 440 * 2 ** ((midi - 69) / 12);
  function envelope(gain, t, end, peak, attack, release) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peak, t + attack);
    gain.gain.setValueAtTime(peak, Math.max(t + attack, end - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
  }
  // Timbres: forma de onda, volume, ataque, soltura, filtro e desafinação entre duas vozes
  const VOICES = {
    lead: { wave: 'square', vol: 0.09, attack: 0.01, release: 0.08, cutoff: 3200 },
    arp: { wave: 'square', vol: 0.035, attack: 0.005, release: 0.06, cutoff: 2400, pluck: 0.14 },
    saw: { wave: 'sawtooth', vol: 0.06, attack: 0.01, release: 0.1, cutoff: 2600, detune: 8 },
    brass: { wave: 'sawtooth', vol: 0.07, attack: 0.03, release: 0.12, cutoff: 2200, detune: 6, sweep: true },
    pad: { wave: 'sawtooth', vol: 0.022, attack: 0.35, release: 0.5, cutoff: 1100, detune: 9 },
    bass: { wave: 'square', vol: 0.11, attack: 0.005, release: 0.06, cutoff: 650 },
  };
  function tone(ev, t, dur, out) {
    const v = VOICES[ev.inst];
    const end = t + (v.pluck ? Math.min(dur, v.pluck) : dur);
    ev.notes.forEach(midi => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(v.sweep ? 700 : v.cutoff, t);
      if (v.sweep) filter.frequency.linearRampToValueAtTime(v.cutoff, t + 0.08);
      const gain = ctx.createGain();
      envelope(gain, t, end, v.vol, v.attack, v.release);
      filter.connect(gain).connect(out);
      (v.detune ? [-v.detune, v.detune] : [0]).forEach(cents => {
        const osc = ctx.createOscillator();
        osc.type = v.wave;
        osc.frequency.value = freq(midi);
        osc.detune.value = cents;
        osc.connect(filter);
        osc.start(t); osc.stop(end + 0.05);
      });
    });
  }
  function drum(piece, t, out) {
    if (piece === 'k') {   // bumbo: seno que cai de 140 para 45 Hz
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.frequency.setValueAtTime(140, t); osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);
      gain.gain.setValueAtTime(0.45, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain).connect(out); osc.start(t); osc.stop(t + 0.3);
      return;
    }
    const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    src.buffer = noise;
    filter.type = piece === 's' ? 'bandpass' : 'highpass';
    filter.frequency.value = piece === 's' ? 1800 : 7000;
    const length = piece === 's' ? 0.16 : 0.04;
    gain.gain.setValueAtTime(piece === 's' ? 0.22 : 0.05, t); gain.gain.exponentialRampToValueAtTime(0.001, t + length);
    src.connect(filter).connect(gain).connect(out); src.start(t); src.stop(t + length + 0.02);
  }
  const playEvent = (ev, t, stepDur, out) => (VOICES[ev.inst] ? tone(ev, t, ev.dur * stepDur, out) : drum(ev.inst, t, out));

  // Agendador da música de fundo: olha 0,2 s à frente a cada 50 ms
  function startLoop(name) {
    stopLoop();
    const song = compile(name);
    current = { name, song, start: ctx.currentTime + 0.08, index: 0, cycle: 0 };
    timer = setInterval(tick, 50);
    tick();
  }
  function tick() {
    if (!current) return;
    const { song } = current;
    const horizon = ctx.currentTime + 0.2;
    for (;;) {
      if (current.index >= song.events.length) {
        if (!song.loop) { stopLoop(); return; }
        current.index = 0; current.cycle += 1;
      }
      const ev = song.events[current.index];
      const t = current.start + (current.cycle * song.length + ev.step) * song.stepDur;
      if (t > horizon) return;
      if (t >= ctx.currentTime - 0.02) playEvent(ev, t, song.stepDur, musicBus);
      current.index += 1;
    }
  }
  function stopLoop() { clearInterval(timer); timer = null; current = null; }

  function play(name) {
    wanted = name;
    if (!enabled || !init() || ctx.state !== 'running') return;
    if (current && current.name === name) return;
    startLoop(name);
  }
  function sfx(name) {
    if (!enabled || !init() || ctx.state !== 'running') return;
    const song = compile(name);
    const t0 = ctx.currentTime + 0.03;
    song.events.forEach(ev => playEvent(ev, t0 + ev.step * song.stepDur, song.stepDur, sfxBus));
    const total = song.length * song.stepDur;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(0.15, ctx.currentTime, 0.04);
    musicBus.gain.setTargetAtTime(0.55, t0 + total, 0.3);
  }
  // O navegador só libera o áudio depois de um toque: o primeiro toque liga a música pedida
  function unlock() {
    if (!enabled || !init()) return;
    if (ctx.state !== 'running') ctx.resume().then(() => { if (wanted) play(wanted); });
    else if (wanted && !current) play(wanted);
  }
  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* armazenamento indisponível */ }
    if (on) unlock(); else { stopLoop(); if (ctx) ctx.suspend(); }
  }
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !enabled) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
  return { play, sfx, setEnabled, get enabled() { return enabled; } };
})();
