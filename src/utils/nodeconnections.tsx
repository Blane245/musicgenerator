import Compressor from "../classes/compressor";
import Equalizer from "../classes/equalizer";

export function NodeConnections(panner: StereoPannerNode, equalizer: Equalizer, compressor: Compressor, destination: AudioDestinationNode | MediaStreamAudioDestinationNode) {

    panner.connect(equalizer.front());
    equalizer.back().connect(compressor.compressorNode);
    compressor.compressorNode?.connect(destination);

}