//
// this gets the midi sample from the preset
// splits it up into small chucks, say 0.1 seconds
// each chuck is a different node.
// pitch, volume, and pan modifications are made to each
// chuck based on the time that the generator start until it stops.
// these chucks are fed to the scheduler as the audiocontext advances

import InstReverb from "../../classes/instreverb2";
import SFPG from "../../classes/sfpg";
import { InstrumentZone } from "../../types/soundfonttypes";
import { sourceData, REPEATOPTION } from "../../types/types";
import { getSFGeneratorValues } from "../../utils/soundfont2utils";
import { precision } from "../../utils/util";

// through current time.
let currentSampleIndex: number = 0;
export function getBufferSourceNodesFromSFPG(
  context: AudioContext | OfflineAudioContext,
  gen: SFPG,
  deltaT: number,
  roomConcentrator: GainNode
): sourceData[] {
  // console.log('getting SFPG sources',
  //     'name', gen.name,
  //     'deltaT', deltaT,
  // );
  // get the instrument zone for generator's preset
  if (!gen.preset)
    throw new Error(`Preset '${gen.presetName}' has not been initialized.`);
  const zones: InstrumentZone[] = gen.preset.zones[0].instrument.zones;
  if (zones.length == 0)
    throw new Error(
      `Preset '${gen.presetName}' instrument zones no not exist.`
    );

  // setup the instrument concentrator and passthru nodes gain node
  const concentrator: GainNode = context.createGain();

  // the generator has a start and end time
  const { startTime, stopTime } = gen;
  // A generator will need a number of #chucks = (stoptime-start)/CHUCKSIZE
  const chunkCount = Math.ceil((stopTime - startTime) / deltaT);

  // loop through each time chunks to get the current pitch, volume, and pan
  // for each chunk and apply them to the chunk
  let currentZone: InstrumentZone | null = null;
  let lastPitch: number = -1;
  const sourceData: sourceData[] = [];
  for (let iChunk: number = 0; iChunk < chunkCount; iChunk += 1) {
    if (iChunk == 0) currentSampleIndex = 0;
    // currentSampleIndex = 0;
    const time = iChunk * deltaT;
    const { pitch, volume, pan } = gen.getCurrentValues(time);
    if (lastPitch != pitch) {
      lastPitch = pitch;
      currentSampleIndex = 0;
    }
    // get the instrument's zone from the pitch, with clipping
    const basePitch = Math.ceil(pitch);
    let iZone = zones.findIndex(
      (z) =>
        z.keyRange && basePitch >= z.keyRange.lo && basePitch <= z.keyRange.hi
    );
    if (iZone < 0) iZone = 0;
    if (!currentZone || currentZone != zones[iZone]) {
      currentZone = zones[iZone];
      currentSampleIndex = 0;
    }
    const { sampleRate, startLoop, endLoop, pitchCorrection } =
      currentZone.sample.header;

    // each chuck a number of samples depending on the sample rate and the Chunk size
    const chunkSize = Math.ceil(sampleRate * deltaT);

    // get the soundfont generator values
    const generatorValues: Map<number, number> = getSFGeneratorValues(
      gen.preset,
      currentZone
    );
    // apply adjustments
    const startloopAddrsOffset: number | undefined = generatorValues.get(2);
    const endloopAddrsOffset: number | undefined = generatorValues.get(3);
    const startloopAddrsCoarseOffset: number | undefined =
      generatorValues.get(4);
    const endloopAddrsCoarseOffset: number | undefined =
      generatorValues.get(50);
    const overridingRootKey: number | undefined = generatorValues.get(58);
    const fineTune: number | undefined = generatorValues.get(52);

    const rootKey =
      overridingRootKey !== undefined && overridingRootKey > 0
        ? overridingRootKey
        : currentZone.sample.header.originalPitch;
    const baseDetune =
      100 * rootKey + pitchCorrection - (fineTune ? fineTune : 0);
    const cents = pitch * 100 - baseDetune;
    // const playbackRate = precision(1.0 * Math.pow(2, cents / 1200), 3);
    const playbackRate = 1.0 * Math.pow(2, cents / 1200);
    const loopStart =
      startLoop +
      (startloopAddrsOffset ? startloopAddrsOffset : 0) +
      (startloopAddrsCoarseOffset ? startloopAddrsCoarseOffset * 32768 : 0);
    const loopEnd =
      endLoop +
      (endloopAddrsOffset ? endloopAddrsOffset : 0) +
      (endloopAddrsCoarseOffset ? endloopAddrsCoarseOffset * 32768 : 0);

    // get the chunk's sample and update the next sample index
    const floatSample: Float32Array = getNextSample(
      loopStart,
      loopEnd,
      gen.repeat,
      currentZone.sample.data,
      chunkSize * playbackRate
    );
    // console.log(
    //     'chunkCount', chunkCount,
    //     'iChunk', iChunk,
    //     'time', time,
    //     'currentSampleIndex', currentSampleIndex,
    // 'loopStart', loopStart,
    // 'loopEnd', loopEnd,
    // 'sample length', floatSample.length,
    // 'currentzone', currentZone,
    // 'rootKey', rootKey,
    // 'pitchCorrection', pitchCorrection,
    // 'fineTune', fineTune,
    // 'baseDetune', baseDetune,
    // 'pitch', pitch,
    // 'cents', cents,
    // 'playbackRate', playbackRate,
    // 'sampleRate', sampleRate,
    // )

    // move the chunk into the audio node
    // setting the samples, pan, volume, start time, and stop time
    const buffer: AudioBuffer = context.createBuffer(
      1,
      floatSample.length,
      sampleRate
    );
    const channelData: Float32Array = buffer.getChannelData(0);
    channelData.set(floatSample);
    const source: AudioBufferSourceNode = context.createBufferSource();
    source.buffer = buffer;
    source.loop = false;
    source.playbackRate.value = playbackRate;
    const vol: GainNode = context.createGain();
    vol.gain.value = volume / 100;
    const panner: StereoPannerNode = context.createStereoPanner();
    panner.pan.value = Math.min(Math.max(pan, -1.0), 1.0);

    // connect make the path source->vol->panner->concentrator
    source.connect(vol);
    vol.connect(panner);
    panner.connect(concentrator);

    // get a copy of the generator's reverb and connect it
    let sReverb: InstReverb | undefined = undefined;
    if (gen.reverb.enabled) {
      sReverb = gen.reverb.copy();
      sReverb.setContext(context);
      if (sReverb.effect) {
        concentrator.connect(sReverb.effect);
        sReverb.effect.connect(roomConcentrator);
      }
    }

    // and add it to the accumulated sources
    sourceData.push({
      generator: gen,
      source: source,
      reverb: sReverb,
      start: precision(time + gen.startTime, 3),
      stop: precision(time + gen.startTime + deltaT, 3),
      lastGain: iChunk == chunkCount - 1 ? vol : null,
    });
  }

  // make the connections
  // concentrator->roomconcentrator
  // optionally concentrator->instreverb->roomconcentrator
  concentrator.connect(roomConcentrator);
  if (gen.reverb.enabled) {
    gen.reverb.setContext(context);
    if (gen.reverb.effect) {
      concentrator.connect(gen.reverb.effect);
      gen.reverb.effect.connect(roomConcentrator);
    }
  }

  return sourceData;
}
// get a full chuckSize set of samples from the instrument's samples
// taking into account looping
function getNextSample(
  startLoop: number,
  endLoop: number,
  repeat: REPEATOPTION,
  sample: Int16Array,
  chunkSize: number
): Float32Array {
  const nSamp = Math.ceil(chunkSize);
  const floatSample: Float32Array = new Float32Array(nSamp);
  for (let i = 0; i < nSamp; i++) {
    if (currentSampleIndex > endLoop && repeat == REPEATOPTION.None)
      floatSample[i] = 0.0;
    else floatSample[i] = sample[currentSampleIndex] / 32768.0;
    currentSampleIndex++;
    if (currentSampleIndex > endLoop) {
      if (repeat == REPEATOPTION.Sample) currentSampleIndex = startLoop;
      else if (repeat == REPEATOPTION.Beginning) currentSampleIndex = 0;
    }
  }
  return floatSample;
}
