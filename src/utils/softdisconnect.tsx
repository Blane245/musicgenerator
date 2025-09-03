// disconnect an audio node from another even if it not currently connected
export function softDisconnect (source: AudioNode, destination: AudioNode) {
    try {
        source.disconnect(destination);
    } catch (e) {}
}