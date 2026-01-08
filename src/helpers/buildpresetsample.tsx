import { samplePool } from 'sfcomponents/samplepool';
import { Preset } from 'sfcomponents/types';
import buildElementSamples from './buildelementsamples';
import getActiveZones from './getactivezones';

// gt the preset samples for all instruments
export default function buildPresetSample(props: {
	preset: Preset | undefined;
	interval: number; // the note's time interval
	duration: number; // the note's duration with that interval
	pitch1: number; // first pitch
	pitch2: number; // second pitch for glissando
}): number[][] {
	const { preset, interval, duration, pitch1, pitch2 } = props;
	const result: number[][] = [];
	if (preset == undefined) return result;
	//TODO velocity is set to 0 - no control currently available
	// get all of the zones for this preset. Each represets a different instrument
	const zones = getActiveZones(preset, Math.round(pitch1), 10);
	zones.forEach((zone) => {
		// get the sample
		const { sample: instrumentSample, header } = samplePool(zone.sample);

		// get the preset merged generator attributes
		const {
			startLoop,
			endLoop,
			originalPitch,
			pitchCorrection,
			sampleRate: instrumentSampleRate,
		} = header;
		const {
			// @ts-ignore
			overridingRootKey,
			// @ts-ignore
			fineTune = 0,
			// @ts-ignore
			startloopAddrsOffset = 0,
			// @ts-ignore
			startloopAddrsCoarseOffset = 0,
			// @ts-ignore
			endloopAddrsOffset = 0,
			// @ts-ignore
			endloopAddrsCoarseOffset = 0,
			// @ts-ignore
			delayVolEnv = -12000,
			// @ts-ignore
			attackVolEnv = -12000,
			// @ts-ignore
			holdVolEnv = -12000,
			// @ts-ignore
			decayVolEnv = -12000,
			// @ts-ignore
			sustainVolEnv = -12000,
			// @ts-ignore
			releaseVolEnv = -12000,
			// @ts-ignore
			sampleModes = 0,
			// @ts-ignore
			initialAttenuation = 0,
		} = zone.mergedGenerators;

		// get the starting playback rate
		const rootKey =
			overridingRootKey !== undefined && overridingRootKey !== -1
				? overridingRootKey
				: originalPitch;
		const baseDetune = 100 * rootKey + pitchCorrection - fineTune;
		const cents1 = pitch1 * 100 - baseDetune - 45;

		//TODO all sort of nastiness can occur here if pitch2 is 
		// a long way from pitch1. It may be in a different zone
		// and other tuning and different instruments may apply there.
		// for now, we just assume it's in the same zone. 
		const cents2 = pitch1 == pitch2 ? cents1 : pitch2 * 100 - baseDetune - 45;
		const sampleRate: number = instrumentSampleRate;

		// get the sample looping parameters and override looping if requested
		let loopStart: number = 0;
		let loopEnd: number = 0;
		let loop = false;
		if (sampleModes == 1) {
			loopStart = startLoop + startloopAddrsOffset + startloopAddrsCoarseOffset * 32768;
			loopEnd = endLoop + endloopAddrsOffset + endloopAddrsCoarseOffset * 32768;
			loop = true;
		} else if (sampleModes == 0) {
			loop = false;
		}

		// build the sample using resampling
		const sample: number[] = buildElementSamples({
			interval,
			duration,
			instrumentSample,
			instrumentSampleRate: sampleRate,
			cents1,
			cents2,
			loop,
			loopStart,
			loopEnd,
		});
		result.push(sample);
	});
	return result;
}
