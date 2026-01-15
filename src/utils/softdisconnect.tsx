// disconnect an audio node from another even if it not currently connected
export function softDisconnect (source: AudioNode, destination: AudioNode) {
    try {
        source.disconnect(destination);
    } catch (e) {
        // Ignore errors when nodes are not connected
        if (typeof e != typeof DOMException && (e as DOMException).name != "InvalidAccessError") {
            throw new Error (`Unexpected error while disconnecting source from a destination: ${(e as Error).message}`);
        }
    }
}