/* Western Australia studies: each imagined setting gets its own synthesized
 * ambience - jungle clearing, wetland, open meadow, shallow lagoon. All
 * synthesis, no samples, no voice. The app's honest framing stands: these
 * are textures of imagined habitats, not wildlife or location recordings. */

import {
  makeCtx, windNoise, lapping, rustle, birdChirps, croaks, insects,
} from './soundscape-layers.js';

const SEED = 6421;

export const LAYER_DEFS = {
  canopyWind: { seconds: 10, seed: SEED + 1, render: (c) => windNoise(c, { color: 0.014, gustDepth: 0.5, base: 0.42, seed: SEED + 1 }) },
  leafRustle: { seconds: 10, seed: SEED + 2, render: (c) => rustle(c, { gain: 0.15, seed: SEED + 2 }) },
  jungleBirds: { seconds: 10, seed: SEED + 3, render: (c) => birdChirps(c, { count: 8, fLo: 1900, fHi: 3300, gain: 0.2, trill: 16, syllables: 2, minGap: 0.9, seed: SEED + 3 }) },
  stillWater: { seconds: 10, seed: SEED + 4, render: (c) => lapping(c, { gain: 0.24, period: 3.8, depth: 0.4, seed: SEED + 4 }) },
  frogs: { seconds: 10, seed: SEED + 5, render: (c) => croaks(c, { count: 6, f: 580, gain: 0.15, seed: SEED + 5 }) },
  wetlandInsects: { seconds: 10, seed: SEED + 6, render: (c) => insects(c, { f: 4700, pulseHz: 22, gain: 0.045, q: 22, seed: SEED + 6 }) },
  meadowWind: { seconds: 10, seed: SEED + 7, render: (c) => windNoise(c, { color: 0.025, gustDepth: 0.65, base: 0.4, seed: SEED + 7 }) },
  grassRustle: { seconds: 10, seed: SEED + 8, render: (c) => rustle(c, { gain: 0.12, seed: SEED + 8 }) },
  meadowBirds: { seconds: 10, seed: SEED + 9, render: (c) => birdChirps(c, { count: 5, fLo: 2200, fHi: 3400, gain: 0.15, minGap: 1.3, seed: SEED + 9 }) },
  lagoonLap: { seconds: 10, seed: SEED + 10, render: (c) => lapping(c, { gain: 0.36, period: 2.6, depth: 0.55, seed: SEED + 10 }) },
  lagoonWind: { seconds: 10, seed: SEED + 11, render: (c) => windNoise(c, { color: 0.028, gustDepth: 0.5, base: 0.38, seed: SEED + 11 }) },
  shorebirds: { seconds: 10, seed: SEED + 12, render: (c) => birdChirps(c, { count: 4, fLo: 1300, fHi: 2200, durLo: 0.15, durHi: 0.4, gain: 0.14, minGap: 1.6, seed: SEED + 12 }) },
};

/* One scene per study index: 0 parrot clearing, 1 stork wetland,
   2 horse meadow, 3 flamingo lagoon. */
export const SCENES = [
  [['canopyWind', 0.85], ['leafRustle', 0.9], ['jungleBirds', 0.8]],
  [['stillWater', 0.9], ['frogs', 0.85], ['wetlandInsects', 0.9]],
  [['meadowWind', 0.9], ['grassRustle', 0.9], ['meadowBirds', 0.8]],
  [['lagoonLap', 0.9], ['lagoonWind', 0.7], ['shorebirds', 0.7]],
];

export function createSoundscape() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const context = new Ctx();
  const master = context.createGain();
  master.gain.value = 0.22;
  master.connect(context.destination);
  const buffers = new Map();
  let current = [];
  let alive = true;

  const bufferFor = (id) => {
    if (!buffers.has(id)) {
      const def = LAYER_DEFS[id];
      const c = makeCtx(context.sampleRate, def.seconds, def.seed);
      const out = def.render(c) || c;
      const b = context.createBuffer(2, out.L.length, context.sampleRate);
      b.getChannelData(0).set(out.L);
      b.getChannelData(1).set(out.R);
      buffers.set(id, b);
    }
    return buffers.get(id);
  };

  return {
    context,
    master,
    setScene(index) {
      const t = context.currentTime;
      const scene = SCENES[index] || SCENES[0];
      const next = scene.map(([layer, gain]) => {
        const source = context.createBufferSource();
        source.buffer = bufferFor(layer);
        source.loop = true;
        const g = context.createGain();
        g.gain.value = 0;
        g.gain.setTargetAtTime(gain, t, 0.8);
        source.connect(g);
        g.connect(master);
        source.start();
        return { source, g };
      });
      const old = current;
      current = next;
      old.forEach(({ source, g }) => {
        g.gain.setTargetAtTime(0, t, 0.5);
        setTimeout(() => {
          if (!alive) return;
          try { source.stop(); source.disconnect(); g.disconnect(); } catch { /* stopped */ }
        }, 3000);
      });
    },
    dispose() {
      alive = false;
      current.forEach(({ source }) => { try { source.stop(); } catch { /* stopped */ } });
      void context.close();
    },
  };
}
