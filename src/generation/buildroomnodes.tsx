import Compressor from "classes/compressor";
import Equalizer from "classes/equalizer";

// create a room concentrator and connect the concentrator->compressor->equalizer
export function buildRoomNodes(
  compressor: Compressor,
  equalizer: Equalizer,
  context: AudioContext | OfflineAudioContext
): GainNode {
  equalizer.setContext(context);
  compressor.setContext(context);
  const concentrator: GainNode = context.createGain();
  concentrator
    .connect(compressor.effect as DynamicsCompressorNode)
    .connect(equalizer.front());
  equalizer.back().connect(context.destination);
  return concentrator;
}
