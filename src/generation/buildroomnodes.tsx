import Reverb from "../classes/reverb";
import Compressor from "../classes/compressor";
import Equalizer from "../classes/equalizer";
import Volume from "../classes/volume";

// create a room concentrator and connect the concentrator->volume->(reverb->)compressor->equalizer
export function buildRoomNodes(
  compressor: Compressor,
  equalizer: Equalizer,
  volume: Volume,
  reverb: Reverb,
  context: AudioContext | OfflineAudioContext
): GainNode {
  const concentrator: GainNode = context.createGain();
  concentrator.connect(volume.effect as GainNode);
  // reverb connect source to destination as well as insert convolution if defined
    reverb.connect((volume.effect as GainNode), equalizer.front());
    equalizer.back().connect(compressor.effect as DynamicsCompressorNode);
    (compressor.effect as DynamicsCompressorNode).connect(context.destination);
  return concentrator;
}
