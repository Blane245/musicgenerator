import Stochastic from "classes/generators/stochastic";
import { StochasticValues } from "types";

interface StochasticReportProps {
  generator: Stochastic;
}
export default function StochasticReport(props: StochasticReportProps): JSX.Element {
  const { generator: g } = props;
  const v: StochasticValues = g.values;
  const deltaT: number = v.Tc / v.Nt;
  return (
    <>
      <table>
        <thead>
          <tr>
            <th colSpan={5}>Composition Parameters</th>
            <th colSpan={4}>Dynamic Parameters</th>
          </tr>
          <tr>
            <th>Ensemble</th>
            <th>Length (sec)</th>
            <th>Time Cells</th>
            <th>Events/Cell</th>
            <th>Random Seed</th>
            <th>Sounds/sec</th>
            <th>Dynamics Seed</th>
            <th>Pan Controls</th>
            <th>Intensity Controls</th>
          </tr>
        </thead>
        <tbody>
          <td>
            {!!v.ensemble && `${v.ensemble.name}:${v.ensemble.description}`}
          </td>
          <td>{v.Tc}</td>
          <td>{v.Nt}</td>
          <td>{v.lambda}</td>
          <td>{v.compositionSeed}</td>
          <td>{v.delta}</td>
          <td>{v.dynamicsSeed}</td>
          <td>
            {`Scope: ${v.panOption}`}
            <br/>
            {`Method: ${v.panAlgorithm}`}
            <br/>
            {`Cycle Time (sec): ${v.panParameters.cycleTime}`}
          </td>
          <td>
            {`Scope: ${v.intensityOption}`}
            <br/>
            {`Method: ${v.intensityTransitionOption}`}
            <br/>
            {`Cycle Time (sec): ${v.intensityParameters.cycleTime}`}
          </td>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th colSpan={10}>Voices</th>
          </tr>
          <tr>
            <th>Muted</th>
            <th>Volume</th>
            <th>Velocity</th>
            <th>Name</th>
            <th>Description</th>
            <th>Timbre</th>
            <th>Register (midi)</th>
            <th>Duration (sec)</th>
            <th>SoundFont</th>
            <th>Preset</th>
          </tr>
        </thead>
        <tbody>
          {v.voices.map((voice, i) => (
            <tr key={`g-${g.name}-voice-${i}`}>
              <td>{voice.muted ? "Yes" : "No"}</td>
              <td>{voice.volume}</td>
              <td>{voice.velocity}</td>
              <td>{voice.name}</td>
              <td>{voice.description}</td>
              <td>{voice.timbre}</td>
              <td>{`(${voice.registerLo},${voice.registerHi})`}</td>
              <td>{voice.duration}</td>
              <td>{voice.soundFontFile}</td>
              <td>{voice.presetName}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th colSpan={v.voices.length + 2}>Composition</th>
          </tr>
          <tr>
            <th>Time (sec)</th>
            {v.voices.map((voice) => (
              <th key={`g-${g.name}-v-${voice.name}`}>{voice.name}</th>
            ))}
            <th>Sum</th>
          </tr>
        </thead>
        <tbody>
          {v.composition.map((row, i) => (
            <tr key={`g-${g.name}-t-${i}`}>
              <td>{deltaT * i}</td>
              {row.map((v,j) => (
                <td key={`g-${g.name}-r-${j}`}>{v}</td>
              ))}
              <td>
                {row
                  .reduce(function (x, y) {
                    return x + y;
                  }, 0)
                  .toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
