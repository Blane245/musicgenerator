import { useCMGContext } from "cmgcontext";
import RoomCompressorDialog from "dialogs/room/roomcompressordialog";
import RoomEqualizerDialog from "dialogs/room/roomequalizerdialog";
import RoomReverbDialog from "dialogs/room/roomreverbdialog";
import RoomVolumeDialog from "dialogs/room/roomvolumedialog";
import { GeneratorType, RawSourceData, SignalLevelsType } from "types";
import { DrawSpectrum } from "./signalmonitor";
export const signalWidth: number = 300;

interface FooterProps {
  selectedGenerators: GeneratorType[];
  sourceData: RawSourceData[];
  activeGeneratorsCount: number;
  activeSourcesCount: number;
  activeGenerators: React.MutableRefObject<string[]>;
  signalLevels: SignalLevelsType;
  frequencyDisplay: string;
  frequencyBins: Float32Array;
  rightVolumes: string;
  rightMaxes: string;
  leftVolumes: string;
  leftMaxes: string;
}

export default function Footer(props: FooterProps): JSX.Element {
  const {
    selectedGenerators,
    sourceData,
    activeGeneratorsCount,
    activeSourcesCount,
    activeGenerators,
    signalLevels,
    frequencyDisplay,
    frequencyBins,
    rightVolumes,
    rightMaxes,
    leftVolumes,
    leftMaxes,
  } = props;
  const { displayWidth, footerHeight } = useCMGContext();
  const spectrumHeight: number = footerHeight * 0.67;
  const volumeHeight: number = footerHeight - spectrumHeight;
  const volumeOffset: number = spectrumHeight;
  return (
    <div
      className="preview-footer"
      style={{ width: displayWidth, height: footerHeight }}
    >
      <div className="status">
        <table>
          <thead>
            <tr>
              <th>Counts</th>
              <th>Generators</th>
              <th>Sources</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total</td>
              <td>{selectedGenerators.length}</td>
              <td>{sourceData.length}</td>
            </tr>
            <tr>
              <td>Active </td>
              <td>{activeGeneratorsCount}</td>
              <td>{activeSourcesCount}</td>
            </tr>
          </tbody>
        </table>
        <div>Active Generators:</div>
        <div style={{overflowWrap:"anywhere"}}>{activeGenerators.current.toString()}</div>
      </div>
      {signalLevels ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={signalWidth}
            height={footerHeight}
            viewBox={`0 0 ${signalWidth} ${footerHeight}`}
            className="leftSignal"
          >
            <rect
              className="leftSpectrum"
              id="leftspectrum"
              x={0}
              y={0}
              width={signalWidth}
              height={spectrumHeight}
            />
            {frequencyDisplay == "spectrum" ? (
              DrawSpectrum(
                signalLevels.leftSpectrum,
                frequencyBins,
                spectrumHeight,
                signalWidth
              )
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={signalWidth}
                height={footerHeight}
                viewBox={`0 0 ${signalWidth} ${footerHeight}`}
                className="leftspectrum"
                id="leftsonogram"
              />
            )}
            <rect
              className="leftVolume"
              id="leftvolume"
              x={0}
              y={volumeOffset}
              width={signalWidth}
              height={volumeHeight}
            />
            <polyline className="leftPoint" points={leftVolumes} />
            <polyline className="leftMax" points={leftMaxes} />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={signalWidth}
            height={footerHeight}
            viewBox={`0 0 ${signalWidth} ${footerHeight}`}
            className="rightSignal"
          >
            <rect
              className="rightSpectrum"
              id="rightspectrum"
              x={0}
              y={0}
              width={signalWidth}
              height={spectrumHeight}
            />
            {frequencyDisplay == "spectrum" ? (
              DrawSpectrum(
                signalLevels.leftSpectrum,
                frequencyBins,
                spectrumHeight,
                signalWidth
              )
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={signalWidth}
                height={footerHeight}
                viewBox={`0 0 ${signalWidth} ${footerHeight}`}
                className="rightspectrum"
                id="rightsonogram"
              />
            )}
            <rect
              className="rightVolume"
              id="rightvolume"
              x={0}
              y={volumeOffset}
              width={signalWidth}
              height={volumeHeight}
            />

            <polyline className="rightPoint" points={rightVolumes} />
            <polyline className="rightMax" points={rightMaxes} />
          </svg>
        </>
      ) : null}
      <RoomVolumeDialog />
      <RoomReverbDialog />
      <RoomCompressorDialog />
      <RoomEqualizerDialog />
    </div>
  );
}
