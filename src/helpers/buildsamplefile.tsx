// create a recording of this composition

import { SAMPLERATE } from "types";
import { bufferToMp3 } from "utils/buffertomp3";

// the samples are in two channels
export default function buildSampleFile(props: { fileHandle: any; stereo: number[][] }): string[] {
    const {fileHandle, stereo} = props;
	const ctx: OfflineAudioContext = new OfflineAudioContext(2, stereo[0].length, SAMPLERATE);
	const source = ctx.createBufferSource();
	source.buffer = ctx.createBuffer(2, stereo[0].length, SAMPLERATE);
	const offLinechannelDataL = source.buffer.getChannelData(0);
	offLinechannelDataL.set(stereo[0]);
	const offLinechannelDataR = source.buffer.getChannelData(1);
	offLinechannelDataR.set(stereo[1]);
    const sampleCount: number = stereo[0].length;

	// insert a biquad filter between the source and destination
	// to reduce high frequency phase noise
	const filter: BiquadFilterNode = ctx.createBiquadFilter();
	filter.type = 'highshelf';
	filter.frequency.value = 12000;
	filter.gain.value = -35;
	source.connect(filter).connect(ctx.destination);
	source.start();
	ctx.startRendering().then(async (renderBuffer) => {
		// write the rendered buffer to a mp3 file
		const channels: Float32Array[] = [];
		channels.push(renderBuffer.getChannelData(0));
		channels.push(renderBuffer.getChannelData(1));
		const blob: Blob = bufferToMp3(channels, SAMPLERATE);

		// Save to disk using File System Access API
		try {
			const writable = await fileHandle.createWritable();
			await writable.write(blob);
			await writable.close();
			// console.log('File saved successfully');
		} catch (err) {
			if (err instanceof Error && err.name !== 'AbortError') {
				console.error('Error saving file:', err);
			}
		}
	});
	return [`composition samples built, length=${sampleCount}`];
}
