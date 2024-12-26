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
  concentrator
    .connect(compressor.effect as DynamicsCompressorNode)
    .connect(equalizer.front());
  if (volume.effect)
    equalizer.back().connect(volume.effect).connect(context.destination);
  else throw new Error("room volume to realized");
  return concentrator;
}
