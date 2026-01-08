import Algorithmic from "classes/generators/algorithmic";
import {
  DrawingSection,
  GENERATORTYPE,
  RawSourceData,
  SectionType,
  SourceToDrawingSectionEntry,
} from "types";
let nInstrument = -1;
let nPercussion = -1;
let nAudio = 0;

export default function drawingSetup(
  sourceData: RawSourceData[],

  previewHeight: number,
  setDrawingSections: (value: React.SetStateAction<DrawingSection[]>) => void,
  setSourceToDrawingSectionMap: (
    value: React.SetStateAction<SourceToDrawingSectionEntry[]>
  ) => void
) {
  // map sources to drawing sections
  const [newSections, newMap] = mapSourcesToSections(sourceData);
  // set up the sections based on their numbers and types
  setupSections(sourceData, newSections, newMap, previewHeight);
  setDrawingSections(newSections);
  setSourceToDrawingSectionMap(newMap);
}
// assign each source to a section depending on the generator type
// and preset bank
// heights and vertical offsets are determined after all sections are known
function mapSourcesToSections(
  sourceData: RawSourceData[]
): [DrawingSection[], SourceToDrawingSectionEntry[]] {
  const newDrawingSections: DrawingSection[] = [];
  const newSourceToDrawingSectionMap: SourceToDrawingSectionEntry[] = [];
  nInstrument = -1;
  nPercussion = -1;
  nAudio = 0;
  sourceData.forEach((s: RawSourceData) => {
    const sectionType = getSectionType(s);
    switch (sectionType) {
      case SectionType.Audio:
        {
          const iSection: number = newDrawingSections.length;
          newDrawingSections.push({
            type: SectionType.Audio,
            height: 0,
            verticalOffset: 0,
            loValue: -1,
            hiValue: 1,
          });
          newSourceToDrawingSectionMap.push({
            sectionIndex: iSection,
            sourceIndex: s.index,
          });
          nAudio++;
          // console.log(
          //   "source",
          //   s.index,
          //   "mapped to section",
          //   sectionType,
          //   "for generator ",
          //   s.gen.name,
          //   iSection
          // );
        }
        break;
      case SectionType.Percussion:
        {
          const iSection: number =
            nPercussion == -1 ? newDrawingSections.length : nPercussion;
          if (nPercussion == -1) {
            nPercussion = newDrawingSections.length;
            newDrawingSections.push({
              type: SectionType.Percussion,
              height: 0,
              verticalOffset: 0,
              loValue: Number.MAX_SAFE_INTEGER,
              hiValue: Number.MIN_SAFE_INTEGER,
            });
          }
          newSourceToDrawingSectionMap.push({
            sectionIndex: iSection,
            sourceIndex: s.index,
          });
          // console.log(
          //   "source",
          //   s.index,
          //   "mapped to section",
          //   sectionType,
          //   "for generator ",
          //   s.gen.name,
          //   iSection
          // );
        }
        break;
      case SectionType.Instrument:
        {
          const iSection: number =
            nInstrument == -1 ? newDrawingSections.length : nInstrument;
          if (nInstrument == -1) {
            nInstrument = newDrawingSections.length;
            newDrawingSections.push({
              type: SectionType.Instrument,
              height: 0,
              verticalOffset: 0,
              loValue: Number.MAX_SAFE_INTEGER,
              hiValue: Number.MIN_SAFE_INTEGER,
            });
          }
          newSourceToDrawingSectionMap.push({
            sectionIndex: iSection,
            sourceIndex: s.index,
          });
          // console.log(
          //   "source",
          //   s.index,
          //   "mapped to section",
          //   sectionType,
          //   "for generator",
          //   s.gen.name,
          //   iSection
          // );
        }
        break;
      case SectionType.None:
        break;
      default: {
        // console.log(
        //   "source has no section for generator",
        //   s.gen.name,
        //   s.gen.type
        // );
        break;
      }
    }
  });
  return [newDrawingSections, newSourceToDrawingSectionMap];
}
// basd on the source data types, the drawing is partitioned into sections
// based on the following scheme
// 1. Only instruments or only percussion or only 1 audiofile - the full drawing
//    is allocated to the section
// 2. N audio files - each AF section is allocated 1/N of the drawing
// 3. Instrument + percussion, 0 AF - 75% to instrument, 25% to percussion
// Instrument, no percussion, n AF - 70% to instrument, 30% to audiofile
// No instrument, percussion, n AF - 70% to percussion, 30% to audiofile
// 4. Instrument + percussion + n AF - 70% to instrument, 25% to percussion, 10% to all AFs split 10%/N each
function setupSections(
  sourceData: RawSourceData[],
  drawingSections: DrawingSection[],
  map: SourceToDrawingSectionEntry[],
  height: number
) {
  // abnormal case - no sections
  if (drawingSections.length == 0) {
    // console.log("no drawing sections defined");
    return;
  }

  // only one section
  if (
    (nInstrument != -1 && nPercussion == -1 && nAudio == 0) ||
    (nInstrument == -1 && nPercussion != -1 && nAudio == 0) ||
    (nInstrument == -1 && nPercussion == -1 && nAudio == 1)
  ) {
    // console.log("one drawing section");
    drawingSections[0].height = height;
    drawingSections[0].verticalOffset = 0;
  }
  // only n audiofiles
  else if (nInstrument == -1 && nPercussion == -1) {
    // console.log(nAudioFiles, "audiofile sections");
    const sectionSize: number = height / nAudio;
    let offset: number = 0;
    drawingSections.forEach((section) => {
      section.height = sectionSize;
      section.verticalOffset = offset;
      offset += sectionSize;
    });
  }
  // instrument + percussion, no audiofiles
  else if (nInstrument > -1 && nPercussion > -1 && nAudio == 0) {
    // console.log("instrument and percussion sections");
    // there are two sections. first wil be instrument at 75%, then percussion at 25%
    const sectionSize: number = height * 0.75;
    drawingSections[nInstrument].height = sectionSize;
    drawingSections[nInstrument].verticalOffset = 0;
    drawingSections[nPercussion].height = height - sectionSize;
    drawingSections[nPercussion].verticalOffset = sectionSize;
  }

  // instrument, no percussion, n audiofiles
  // no instrument, percussion, n audiofiles
  else if (
    (nInstrument > -1 && nPercussion == -1 && nAudio > 0) ||
    (nInstrument == -1 && nPercussion > -1 && nAudio > 0)
  ) {
    // console.log(
    //   "either 1 instrument or percussion, and",
    //   nAudioFiles,
    //   "audiofiles"
    // );
    const section1: number = height * 0.7;
    const section2: number = height * 0.3;
    if (nInstrument > -1) {
      drawingSections[nInstrument].height = section1;
    }
    if (nPercussion > -1) {
      drawingSections[nPercussion].height = section1;
    }
    // process each audiofile section
    const subsectionHeight = section2 / nAudio;
    let offset: number = section1;
    drawingSections.forEach((section) => {
      if (section.type != SectionType.Audio) return;
      section.height = subsectionHeight;
      section.verticalOffset = offset;
      offset += subsectionHeight;
    });
  }
  // instrument + percussion + n audioFiles
  else if (nInstrument > -1 && nPercussion > -1 && nAudio > 0) {
    // console.log(
    //   "1 instrument and percussion, and",
    //   nAudioFiles,
    //   "audiofiles"
    // );
    const section1: number = height * 0.7;
    const section2: number = height * 0.2;
    const section3: number = height * 0.1;
    drawingSections[nInstrument].verticalOffset = 0;
    drawingSections[nInstrument].height = section1;
    drawingSections[nPercussion].height = section2;
    drawingSections[nPercussion].verticalOffset = section1;
    // process each audiofile section
    const subsectionHeight = section3 / nAudio;
    let offset: number = section2;
    drawingSections.forEach((section) => {
      if (section.type != SectionType.Audio) return;
      section.height = subsectionHeight;
      section.verticalOffset = offset;
      offset += subsectionHeight;
    });
  } else {
    console.log(
      "drawing section case not determined",
      "nInstrument",
      nInstrument,
      "nPercussion",
      nPercussion,
      "nAudio",
      nAudio
    );
  }

  // determine to lo and hi value for each section
  map.forEach((m) => {
    const section: DrawingSection = drawingSections[m.sectionIndex];
    const source: RawSourceData | undefined = sourceData.find(
      (s) => s.index == m.sourceIndex
    );
    if (source == undefined) {
      // console.log(
      //   "source not found with index",
      //   m.sourceIndex,
      //   "during lo hi search"
      // );
      return;
    }
    if (section.type != SectionType.Audio) {
      section.loValue = Math.min(source.source.note, section.loValue);
      section.hiValue = Math.max(source.source.note, section.hiValue);
    }
  });
}

// get the type of the drawing section based on the source type
function getSectionType(s: RawSourceData): SectionType {
  if (
    s.gen.type == GENERATORTYPE.AudioFile ||
    s.gen.type == GENERATORTYPE.Stochastic
  ) {
    return SectionType.Audio;
  } else if (s.gen.type == GENERATORTYPE.Algorithmic) {
    const gen: Algorithmic = s.gen as Algorithmic;
    if (gen.preset != undefined) {
      if (gen.preset.header.bank == 128) {
        return SectionType.Percussion;
      } else return SectionType.Instrument;
    } else return SectionType.None;
  } else return SectionType.None;
}
