// this gets the midi sample from the preset and prepares it for the 

import { InstrumentZone, Preset } from "../types/soundfonttypes";
import { getGeneratorValues } from "./soundfont2utils";

// this gets the midi sample from the preset and prepares it for the 
// player. The volume envelop is handled at the time the note is played
export function getBufferSourceNodeFromSample(
    context: AudioContext,
    preset: Preset,
    midi: number,
): { source: { buffer: AudioBufferSourceNode, envelop: Envelop }, message: Message } {

    // get hold of the midi generator values and the instrument for the preset
    const generatorValues: Map<number, number> = getGeneratorValues(preset as Preset, midi);

    // get the sample from the preset instrument
    const iZones: InstrumentZone[] = preset.zones[0].instrument.zones;
    let IZoneIndex: number = iZones
        .findIndex((z) => (z.keyRange && midi >= z.keyRange.lo && midi <= z.keyRange.hi));
    if (IZoneIndex < 0) IZoneIndex = 0;

    // convert the sample to floating numbers
    const { header, data } = iZones[IZoneIndex].sample;
    const float32 = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
        float32[i] = data[i] / 32768.0;
    }

    // create the buffer contains the sample
    const buffer = context.createBuffer(1, float32.length, header.sampleRate);
    const channelData = buffer.getChannelData(0);
    channelData.set(float32);
    const source = context.createBufferSource();
    source.buffer = buffer;

    // apply adjustments
    const startloopAddrsOffset: number | undefined = generatorValues.get(2);
    const endloopAddrsOffset: number | undefined = generatorValues.get(3);
    const startloopAddrsCoarseOffset: number | undefined = generatorValues.get(4);
    const endloopAddrsCoarseOffset: number | undefined = generatorValues.get(50);
    const overridingRootKey: number | undefined = generatorValues.get(58);
    const fineTune: number | undefined = generatorValues.get(52);
    const sampleModes: number | undefined = generatorValues.get(54);
    const velocity: number | undefined = generatorValues.get(47);

    const rootKey = overridingRootKey !== undefined && overridingRootKey !== -1 ? overridingRootKey : header.originalPitch;
    const baseDetune = 100 * rootKey + header.pitchCorrection - (fineTune ? fineTune : 0);
    const cents = midi * 100 - baseDetune;
    const playbackRate = 1.0 * Math.pow(2, cents / 1200);
    source.playbackRate.value = playbackRate;

    const loopStart = header.startLoop +
        (startloopAddrsOffset ? startloopAddrsOffset : 0) +
        (startloopAddrsCoarseOffset ? startloopAddrsCoarseOffset * 32768 : 0);
    const loopEnd = header.endLoop +
        (endloopAddrsOffset ? endloopAddrsOffset : 0) +
        (endloopAddrsCoarseOffset ? endloopAddrsCoarseOffset * 32768 : 0);
    if (loopEnd > loopStart && sampleModes === 1) {
        source.loopStart = loopStart / header.sampleRate;
        source.loopEnd = loopEnd / header.sampleRate;
        source.loop = true;
    }
    // pass the envelop
    const attackVolEnv: number | undefined = generatorValues.get(34);
    const decayVolEnv: number | undefined = generatorValues.get(36);
    const envelop = { velocity, attackVolEnv, decayVolEnv };

    return { source: { buffer: source, envelop: envelop }, message: { error: false, text: '' } }
}

