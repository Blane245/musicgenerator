import SignalLevel from "classes/signallevel";
import { SignalLevelsType } from "types";
import { linearInterpolate } from "utils/interpolation";

// get the volume and spectra once a second
export default function signalMonitor(
  paused: React.MutableRefObject<boolean>,
  playing: React.MutableRefObject<boolean>,
  signalId: number,
  audioContext: AudioContext,
  playbackLength: number,
  setSignalLevels: (value: React.SetStateAction<SignalLevelsType>) => void,
  analyser: SignalLevel | null,
  frequencyDisplay: string,
  signalWidth: number,
  footerHeight: number,
  setLeftVolumes: (value: React.SetStateAction<string>) => void,
  setRightVolumes: (value: React.SetStateAction<string>) => void,
  setLeftMaxes: (value: React.SetStateAction<string>) => void,
  setRightMaxes: (value: React.SetStateAction<string>) => void,
  frequencyBins: Float32Array
) {
  const spectrumHeight: number = footerHeight * 0.67;
  const volumeHeight: number = footerHeight - spectrumHeight;
  const volumeOffset: number = spectrumHeight;

  if (paused.current) {
    // console.log("signalMonitor paused");
    signalId && clearTimeout(signalId);
    return;
  }
  if (!audioContext) return;
  if (playing.current && audioContext.currentTime <= playbackLength) {
    // get the current volume and spectrum levels
    setSignalLevels((): SignalLevelsType => {
      if (!analyser)
        return {
          leftVolume: 0,
          leftMax: 0,
          rightVolume: 0,
          rightMax: 0,
          leftSpectrum: new Uint8Array(0),
          rightSpectrum: new Uint8Array(0),
        };
      const {
        leftVolume,
        leftMax,
        rightVolume,
        rightMax,
        leftSpectrum,
        rightSpectrum,
      } = analyser.getValues();

      // add the volume points
      addVolumePoints(leftVolume, leftMax, rightVolume, rightMax);

      // add the sonogram points
      if (frequencyDisplay == "sonogram") {
        const leftSonogram: HTMLOrSVGElement | null =
          document.getElementById("leftsonogram");
        if (leftSonogram)
          AddSonogramPoints(
            leftSonogram as SVGElement,
            leftSpectrum,
            audioContext.currentTime
          );
        const rightSonogram: HTMLOrSVGElement | null =
          document.getElementById("rightsonogram");
        if (rightSonogram)
          AddSonogramPoints(
            rightSonogram as SVGElement,
            rightSpectrum,
            audioContext.currentTime
          );
      }
      return {
        leftVolume,
        leftMax,
        rightVolume,
        rightMax,
        leftSpectrum,
        rightSpectrum,
      };
    });
    signalId = window.setTimeout(signalMonitor, 250,
   paused,
  playing,
  signalId,
  audioContext,
  playbackLength,
  setSignalLevels,
  analyser,
  frequencyDisplay,
  signalWidth,
  footerHeight,
  setLeftVolumes,
  setRightVolumes,
  setLeftMaxes,
  setRightMaxes,
  frequencyBins
       
    );
  } else {
    signalId && clearTimeout(signalId);
    setSignalLevels({
      leftVolume: 0,
      leftMax: 0,
      rightVolume: 0,
      rightMax: 0,
      leftSpectrum: new Uint8Array(0),
      rightSpectrum: new Uint8Array(0),
    });
  }
  const addVolumePoints = (
    leftAverage: number,
    leftMax: number,
    rightAverage: number,
    rightMax: number
  ) => {
    const addNewPoint = (value: number): string => {
      const x: number = linearInterpolate(
        audioContext.currentTime,
        0,
        playbackLength,
        0,
        signalWidth
      );
      const y: number = linearInterpolate(
        Math.min(1, Math.max(0, value)),
        0,
        1,
        volumeHeight + volumeOffset,
        volumeOffset
      );
      return `${x.toString()},${y.toString()}`;
    };
    setLeftVolumes((prev) => {
      const newPoint: string = addNewPoint(leftAverage);
      return prev + " " + newPoint;
    });
    setRightVolumes((prev) => {
      const newPoint: string = addNewPoint(rightAverage);
      return prev + " " + newPoint;
    });
    setLeftMaxes((prev) => {
      const newPoint: string = addNewPoint(leftMax);
      return prev + " " + newPoint;
    });
    setRightMaxes((prev) => {
      const newPoint: string = addNewPoint(rightMax);
      return prev + " " + newPoint;
    });
  };

  function AddSonogramPoints(
    sonogram: SVGElement,
    spectrum: Uint8Array,
    time: number
  ): void {
    const minFrequency: number = frequencyBins[0];
    const maxFrequency: number = frequencyBins[frequencyBins.length - 1];
    const minTime: number = 0;
    const maxTime: number = playbackLength;
    const x: number = linearInterpolate(time, minTime, maxTime, 0, signalWidth);
    for (let i = 0; i < spectrum.length; i++) {
      const y: number = linearInterpolate(
        frequencyBins[i],
        minFrequency,
        maxFrequency,
        spectrumHeight,
        0
      );
      const fill: number = 255 - spectrum[i];
      const child: SVGCircleElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      child.setAttribute("r", "2px");
      child.setAttribute("cx", (x + 1).toString());
      child.setAttribute("cy", (y - 1).toString());
      child.setAttribute("fill", `RGB(${fill},${fill},${fill})`);
      sonogram.appendChild(child);
    }
  }
}
export function DrawSpectrum(
    spectrum: Uint8Array,
    frequencyBins: Float32Array,
    spectrumHeight: number,
    signalWidth: number,

): JSX.Element[] {
    if (!spectrum || spectrum.length == 0) return [<></>];

    // set vertical scale as log
    // console.log('drawing spectrum, length', spectrum.length, 'time', audioContext?.currentTime);
    const result: JSX.Element[] = [];
    const minFrequency = frequencyBins[0];
    const maxFrequency = frequencyBins[frequencyBins.length - 1];
    let d: string = `M 0 ${spectrumHeight * (1.0 - spectrum[0] / 255)} `;
    for (let i = 1; i < spectrum.length; i++) {
      const value: number = isNaN(spectrum[i]) ? 0 : spectrum[i];
      const frequency = frequencyBins[i];
      d += `L 
       ${linearInterpolate(
         frequency,
         minFrequency,
         maxFrequency,
         0,
         signalWidth
       )}
       ${spectrumHeight * (1.0 - value / 255)} `;
    }
    result.push(<path d={d} stroke="red" fill="none" />);
    return result;
  }


