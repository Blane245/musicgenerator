// import { samplePool } from 'sfcomponents/samplepool';
// import { Preset } from 'sfcomponents/types';
// import buildElementSamples from './buildelementsamples';
// import getActiveZones from 'playfunctions/presetProcessing/getactivezones';
// import { dBToGain } from 'sfcomponents/util';
// import { debug } from 'utils/debug';

// // get the preset samples for all instruments
// export default function buildPresetSample(props: {
// 	soundfont: string;
// 	preset: Preset | undefined;
// 	interval: number; // the note's time interval
// 	duration: number; // the note's duration with that interval
// 	pitch1: number; // first pitch
// 	pitch2: number; // second pitch for glissando
// 	volume: number; // volume (dB) of the voice
// 	velocity: number; // soundfont instrument velocity
// }): Float32Array[] {
// 	const { soundfont, preset, interval, duration, pitch1, pitch2, volume, velocity } = props;
// 	const result: Float32Array[] = [];
// 	const gain: number = dBToGain(volume);
// 	debug.info('buildPresetSample: gain for pitch', gain, pitch1);
// 	if (preset == undefined) return result;

// 	// get all of the zones for this preset. Each represets a different instrument
// 	// all instruments have the same velocity
// 	const zones = getActiveZones(preset, Math.round(pitch1), velocity);
// 	zones.forEach((zone) => {
// 		// get the sample
// 		const { sample: instrumentSample, header } = samplePool(soundfont, zone.sample);

// 		// get the preset merged generator attributes
// 		const {
// 			startLoop,
// 			endLoop,
// 			originalPitch,
// 			pitchCorrection,
// 			sampleRate: instrumentSampleRate,
// 		} = header;
// 		const {
// 			// @ts-expect-error cannot find name? 
// 			overridingRootKey,
// 			// @ts-expect-error cannot find name? 
// 			fineTune = 0,
// 			// @ts-expect-error cannot find name? 
// 			startloopAddrsOffset = 0,
// 			// @ts-expect-error cannot find name? 
// 			startloopAddrsCoarseOffset = 0,
// 			// @ts-expect-error cannot find name? 
// 			endloopAddrsOffset = 0,
// 			// @ts-expect-error cannot find name? 
// 			endloopAddrsCoarseOffset = 0,
// 			// @ts-expect-error cannot find name? 
// 			_delayVolEnv = -12000,
// 			// @ts-expect-error cannot find name? 
// 			_attackVolEnv = -12000,
// 			// @ts-expect-error cannot find name? 
// 			_holdVolEnv = -12000,
// 			// @ts-expect-error cannot find name? 
// 			_decayVolEnv = -12000,
// 			// @ts-expect-error cannot find name? 
// 			_sustainVolEnv = -12000,
// 			// @ts-expect-error cannot find name? 
// 			_releaseVolEnv = -12000,
// 			// @ts-expect-error cannot find name? 
// 			sampleModes = 0,
// 			// @ts-expect-error cannot find name? 
// 			_initialAttenuation = 0,
// 		} = zone.mergedGenerators;

// 		// get the starting playback rate
// 		const rootKey =
// 			overridingRootKey !== undefined && overridingRootKey !== -1
// 				? overridingRootKey
// 				: originalPitch;
// 		const baseDetune = 100 * rootKey + pitchCorrection - fineTune;
// 		const cents1 = pitch1 * 100 - baseDetune;

// 		//TODO all sort of nastiness can occur here if pitch2 is 
// 		// a long way from pitch1. It may be in a different zone
// 		// and other tuning and different instruments may apply there.
// 		// for now, we just assume it's in the same zone. 
// 		const cents2 = pitch1 == pitch2 ? cents1 : pitch2 * 100 - baseDetune;
// 		const sampleRate: number = instrumentSampleRate;

// 		// get the sample looping parameters and override looping if requested
// 		let loopStart: number = 0;
// 		let loopEnd: number = 0;
// 		let loop = false;
// 		if (sampleModes == 1) {
// 			loopStart = startLoop + startloopAddrsOffset + startloopAddrsCoarseOffset * 32768;
// 			loopEnd = endLoop + endloopAddrsOffset + endloopAddrsCoarseOffset * 32768;
// 			loop = true;
// 		} else if (sampleModes == 0) {
// 			loop = false;
// 		}

// 		// build the sample using resampling
// 		const sample: Float32Array = buildElementSamples({
// 			interval,
// 			duration,
// 			instrumentSample,
// 			instrumentSampleRate: sampleRate,
// 			cents1,
// 			cents2,
// 			loop,
// 			loopStart,
// 			loopEnd,
// 			gain,
// 		});
// 		result.push(sample);
// 	});
// 	return result;
// }
