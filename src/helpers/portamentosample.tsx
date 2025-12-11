import { sineModulator } from "modulators";
import { midiToFrequency } from "sfcomponents/util";
import { SAMPLERATE } from "types";

// create a sound sample at a specific pitch (midi) for a specific duration (sec)
export default function portamentoSample (pitch: number, duration: number): number[] {
    const sampleCount = SAMPLERATE * duration;
    const buffer: number[] = Array(sampleCount);
    const frequency: number = midiToFrequency(pitch) * 1000;
    const amplitude: number = 1;
    const phase: number = 0;
    let t = 0;
    const deltaT: number = 1/ SAMPLERATE;
    for (let i = 0; i < sampleCount; i++) {
        buffer[i] = sineModulator(t, 0, frequency, amplitude, phase);
        t+=deltaT;
    }
    return buffer;
}