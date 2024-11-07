import SimpleReverb from "../classes/reverb2";
import Compressor from "../classes/compressor";
import Equalizer from "../classes/equalizer";

/**
 * Connect the audio processing chain
 * source to volume to pan to optional reverb to equalizer to compressor
 *
 * @export
 * @param {AudioBufferSourceNode} source - the generated source buffer
 * @param {GainNode} vol - the amount of gain to apply
 * @param {StereoPannerNode} panner - the pan effect
 */
export function frontendNodeConnections(
  source: AudioBufferSourceNode,
  vol: GainNode,
  panner: StereoPannerNode
): void {
  source.connect(vol);
  vol.connect(panner);
}

export function backendNodeConnections(
  panner: StereoPannerNode,
  reverb: SimpleReverb | undefined,
  equalizer: Equalizer,
  compressor: Compressor,
  destination: AudioDestinationNode | MediaStreamAudioDestinationNode
): void {
  // disconnect the back end so it can be reconnected
  try {
    panner.disconnect();
    if (reverb)
      reverb.disconnect();
    equalizer.back().disconnect();
    if (compressor.compressorNode) compressor.compressorNode.disconnect();
  } catch {
  } finally {
    if (reverb && reverb.enabled) {
      console.log('backend connected with reverb')
      reverb.connect(panner, equalizer.front());
    } else {
      console.log('backend conencted without reverb')
      panner.connect(equalizer.front());
    }
    if (compressor.compressorNode) {
      equalizer.back().connect(compressor.compressorNode);
      compressor.compressorNode.connect(destination);
    }
    if (!compressor.compressorNode) console.log('no compressor node')
  }
}
