import { LAYER_DEFS, SCENES } from '../soundscape/soundscape-program.js';
export default {
  defaultScene: 'clearing',
  layers: LAYER_DEFS,
  scenes: {
    clearing: SCENES[0].map(([layer, gain]) => ({ layer, gain })),
    wetland: SCENES[1].map(([layer, gain]) => ({ layer, gain })),
    meadow: SCENES[2].map(([layer, gain]) => ({ layer, gain })),
    lagoon: SCENES[3].map(([layer, gain]) => ({ layer, gain })),
  },
};
