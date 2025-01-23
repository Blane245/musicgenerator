import Compressor from "../classes/compressor";
import Equalizer from "../classes/equalizer";
import Volume from "../classes/volume";

// create a room concentrator and connect the concentrator->compressor->equalizer
export function buildRoomNodes(
  compressor: Compressor,
  equalizer: Equalizer,
  volume: Volume,
  context: AudioContext | OfflineAudioContext
): GainNode {
  equalizer.setContext(context);
  compressor.setContext(context);
  volume.setContext(context);
  const concentrator: GainNode = context.createGain();
  concentrator.connect(volume.effect as GainNode);
    (volume.effect as GainNode).connect(equalizer.front());
    equalizer.back().connect(compressor.effect as DynamicsCompressorNode);
    (compressor.effect as DynamicsCompressorNode).connect(context.destination);
  return concentrator;
}
