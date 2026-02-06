/**
 * Add the channels of the input buffer into the output buffer, truncating each channel if input extends past output.
 * The output buffer channel count is the limited of how many input channels will be merged
 * @param {Float32Array} outputBuffer - the buffer to receive the input
 * @param {Float32Array} inputBuffer - the buffer providing the new data 
 * @param {number} location - the location where the input should be located in the output
 */
export default function addBuffer (outputBuffer:Float32Array[], inputBuffer:Float32Array[], location: number) {
    const nChannels = Math.min(outputBuffer.length, inputBuffer.length);
    for (let iChannel = 0; iChannel < nChannels; iChannel++) {
        const output: Float32Array = outputBuffer[iChannel];
        const input: Float32Array = inputBuffer[iChannel];
        const end: number = location + Math.min(input.length, output.length);
        for (let i = location; i < end; i++) {
            output[i]+=input[i-location];
        }
    }

}