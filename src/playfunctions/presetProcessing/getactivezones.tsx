import { getGeneratorValues } from "sfcomponents/sfgenerators";
import { InstrumentZone, Preset, PresetZone } from "sfcomponents/types";

// select mid range velocity Range
const isActiveZone = (
  zone: PresetZone | InstrumentZone,
  pitch: number,
  velocity: number
): boolean => {
  const keyRange: any = zone.keyRange;
  const velRange: any = zone.velRange;
  const keyCheck: boolean =
    !keyRange || (keyRange.lo <= pitch && pitch <= keyRange.hi);
  const velCheck: boolean =
    !velRange || (velRange.lo <= velocity && velocity <= velRange.hi);
  return keyCheck && velCheck;
};

export default function getActiveZones (preset: Preset, pitch: number, velocity: number) {
  const activeZones = preset.zones
    .filter(
      (pzone: PresetZone) =>
        isActiveZone(pzone, pitch, velocity) && pzone.instrument
    )
    .map((pzone: PresetZone) => {
      return pzone.instrument.zones
        .filter((izone: InstrumentZone) => isActiveZone(izone, pitch, velocity))
        .map((izone: InstrumentZone) => {
          const mergedGenerators = getGeneratorValues(izone, pzone, preset);
          return {
            ...izone,
            mergedGenerators: mergedGenerators,
          };
        });
    })
    .flat();
  return activeZones;
};

