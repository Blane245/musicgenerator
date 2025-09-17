import Reverb from "../classes/reverb";
import Compressor from "../classes/compressor";
import Equalizer from "../classes/equalizer";
import Volume from "../classes/volume";

// create a room concentrator and connect the concentrator->reverb->compressor->equalizer->volume
export function buildRoomNodes(
  compressor: Compressor,
  equalizer: Equalizer,
  volume: Volume,
  reverb: Reverb,
  context: AudioContext | OfflineAudioContext
): GainNode {
  const concentrator: GainNode = context.createGain();
  concentrator.gain.value = 1.0;
  if (
    reverb.effectIn &&
    compressor.effectIn &&
    equalizer.effectIn &&
    volume.effect
  ) {
    concentrator.connect(reverb.effectIn);
    reverb.connect(compressor.effectIn);
    compressor.connect(equalizer.effectIn);
    equalizer.connect(volume.effect);
    volume.effect.connect(context.destination);
  } else concentrator.connect(context.destination);
  return concentrator;
}
