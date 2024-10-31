import { ChangeEvent, useEffect, useState } from "react";
import { useCMGContext } from "../../contexts/cmgcontext"
import { setCompressor, setEqualizer } from "../../utils/cmfiletransactions";


// the footer will contain the equalizer
export default function Footer() {
    const { status, fileContents, setFileContents} = useCMGContext();
    const [gains, setGains] = useState<number[]>([]);
    const [threshold, setThreshold] = useState<number>(-24);
    const [knee, setKnee] = useState<number>(30);
    const [ratio, setRatio] = useState<number>(12);
    const [attack, setAttack] = useState<number>(0.003);
    const [release, setRelease] = useState<number>(0.25);
    // define the equalizer and compressor on startup 
    useEffect(() => {
        const gains: number[] = fileContents.equalizer.gains;
        setGains(gains);
    }, [fileContents.equalizer]);
    useEffect(() => {
        setThreshold(fileContents.compressor.threshold);
        setKnee(fileContents.compressor.knee);
        setRatio(fileContents.compressor.ratio);
        setAttack(fileContents.compressor.attack);
        setRelease(fileContents.compressor.release);

    }, [fileContents.compressor]);

    function handleGainChange(event: ChangeEvent<HTMLInputElement>, i: number) {
        const value = parseInt(event.target.value);
        setEqualizer(i, value, setFileContents);
    }

    function handleParameterChange(event: ChangeEvent<HTMLInputElement>, parameter: string) {
        const value = parseInt(event.target.value);
        setCompressor(parameter, value, setFileContents);
    }
    return (
        <div className="page-footer">
            <div className="page-footer-status">
                {status}
            </div>
            <div className="page-footer-compressor">
                <p className="title">Compressor{fileContents.compressor.compressorNode ? ` - Current Reduction: ${fileContents.compressor.compressorNode?.reduction.toFixed(0)}` : ''}</p>
                <div className="sliders">
                    <div className="compressor-slider">
                        <span className="param">Threshold (dB)</span>
                        <span className="param">{threshold}</span>
                        <input type="range"
                            min="-100" max="0" step="1"
                            value={threshold}
                            onChange={(event) => handleParameterChange(event, 'threshold')}
                        />
                    </div>
                    <div className="compressor-slider">
                        <span className="param">Knee (dB)</span>
                        <span className="param">{knee}</span>
                        <input type="range"
                            min="0" max="40" step="1"
                            value={knee}
                            onChange={(event) => handleParameterChange(event, 'knee')}
                        />
                    </div>
                    <div className="compressor-slider">
                        <span className="param">Ratio (____)</span>
                        <span className="param">{ratio}</span>
                        <input type="range"
                            min="1" max="20" step="1"
                            value={ratio}
                            onChange={(event) => handleParameterChange(event, 'ratio')}
                        />
                    </div>
                    <div className="compressor-slider">
                        <span className="param">Attack (sec)</span>
                        <span className="param">{attack}</span>
                        <input type="range"
                            min="0" max="1000" step="1"
                            value={attack * 1000}
                            onChange={(event) => handleParameterChange(event, 'attack')}
                        />
                    </div>
                    <div className="compressor-slider">
                        <span className="param">Release (sec)</span>
                        <span className="param">{release}</span>
                        <input type="range"
                            min="0" max="100" step="5"
                            value={release * 100}
                            onChange={(event) => handleParameterChange(event, 'release')}
                        />
                    </div>
                </div>

            </div>
            <div className="page-footer-equalizer">
                <p className="title">Equalizer (+- 15dB) Freqs (Hz)</p>
                <div className="sliders">
                    {gains.map((g, i) => {
                        return (
                            <div className="equalizer-slider">
                                <span className="param">
                                    {fileContents.equalizer.frequencies[i] < 1000 ?
                                        fileContents.equalizer.frequencies[i].toString() :
                                        (fileContents.equalizer.frequencies[i] / 1000).toFixed(0).concat('K')}
                                </span>
                                <span className="param">{g}</span>
                                <input type="range"
                                    min="-15" max="15" step="1"
                                    value={g}
                                    onChange={(event) => handleGainChange(event, i)}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}