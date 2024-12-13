import { useEffect, useRef, useState } from "react";
import { loadSoundfont, startPresetNote } from "./sfcomponents";
import useMidiInput from "./sfcomponents/useMidiInput";
import useWebMidi from "./sfcomponents/useWebMidi";

const fonts = ["Vintage Dreams Waves v2", "Donkey Kong Country 2014", "Earthbound_NEW", "SuperMarioWorld","GeneralUser-GS"];

const testData: { midi: number; time: number; duration: number; started: boolean }[] = [
    { midi: 60, time: 0, duration: .1, started: false },
    { midi: 62, time: 1, duration: .1, started: false },
    { midi: 64, time: 2, duration: .1, started: false },
    { midi: 65, time: 3, duration: .1, started: false },
    { midi: 67, time: 4, duration: .1, started: false },
    { midi: 69, time: 5, duration: .1, started: false },
    { midi: 71, time: 6, duration: .1, started: false },
    { midi: 72, time: 7, duration: .1, started: false },
];
const SCHEDULEAHEADTIME: number = 0.1; // how far ahead to schedule audio (seconds)
const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
let timerID: number = 0; // the timer used to set the schedule
let nextTime: number = 0;
function App() {
    const [name, setName] = useState(fonts[0]);
    const [loaded, setLoaded] = useState<any>();
    const [presetIndex, setPresetIndex] = useState(0);
    const [midiInput, setMidiInput] = useState(0);
    const [ctx, setContext] = useState<AudioContext | null>(null);

    const [clickedNote, setClickedNote] = useState<number>();
    const [go, setGo] = useState<boolean>(false);

    const stopHandles = useRef<any[]>([]);
    const webmidi = useWebMidi();
    const midiInputs = Array.from(webmidi?.inputs || []);

    const { activeNotes } = useMidiInput({
        index: midiInput,
        channel: 1,
        noteOn: (e) => {
            if (loaded?.presets?.length) {
                const stopHandle = startPresetNote(
                    ctx,
                    loaded.presets[presetIndex % loaded.presets.length],
                    e.note.number
                    //(ctx?.currentTime || 0) + 0.1,
                );
                stopHandles.current.push([e.note, stopHandle]);
            }
        },
        noteOff: (e) => {
            const index = stopHandles.current.findIndex(([note]) => note.number === e.note.number);
            if (index !== -1) {
                const [, stopHandle] = stopHandles.current[index];
                stopHandle();
                stopHandles.current.splice(index, 1);
            } else {
                console.warn(`note off: no handle found to stop note ${e.note.number}`);
            }
        },
    });

    // useEffect(() => {
    //     setName(fonts[0]);
    //     console.log("name", fonts[0]);
    // });
    useEffect(() => {
        name && loadSoundfont("./soundfonts/" + name + ".sf2").then((sf) => setLoaded(sf));
        console.log("name", name);
    }, [name]);

    // useEffect(() => {
    //     loaded && setContext(typeof AudioParam !== "undefined" ? new AudioContext() : null);
    //     console.log('loaded', loaded);
    // }, [loaded]);

    useEffect(() => {
        go && loaded && setContext(new AudioContext());
    }, [go, loaded]);

    useEffect(() => {
        if (ctx && go) {
            testData.map((item) => {
                item.started = false;
                return item;
            });
            nextTime = 0;
            scheduler();
        }
    }, [go, ctx]);

    function scheduler(): void {
        if (go) {
            const aheadTime: number = (ctx?.currentTime || 0) + SCHEDULEAHEADTIME;
            while (nextTime < aheadTime) {
                testData.map((item, i) => {
                    if (aheadTime > item.time && !item.started) {
                        if (loaded?.presets) {
                          // setClickedNote(item.midi);
                            const stopHandle = startPresetNote(ctx, loaded.presets[presetIndex], item.midi);
                            // setTimeout(() => {
                                stopHandle((ctx?.currentTime || 0) + item.duration);
                                console.log('stop note at ', ctx?.currentTime + item.duration);
                                setClickedNote(undefined);
                            // }, /*Math.random() * */ item.duration * 1000);
                            item.started = true;
                            console.log(item);
                          }
                    }
                    return item;
                });
                nextTime += SCHEDULEAHEADTIME;
            }
            const done: boolean = testData.findIndex((i) => !i.started) < 0;
            if (!done) timerID = window.setTimeout(scheduler, LOOKAHEAD);
            else {
                setGo(false);
                setContext(null);
                clearTimeout(timerID);
            }
        } else clearTimeout(timerID);
    }

    return (
        <div className="space-y-4">
            <h1 className="text-3xl">sfumato demo</h1>
            <p>
                sfumato is a library to use soundfonts on the web. 1. select soundfont 2. select preset. 3. use piano or
                send midi. For more info, go to the{" "}
                <a className="text-green-500" href="https://github.com/felixroos/sfumato#sfumato">
                    sfumato github repo
                </a>
            </p>
            <button onClick={() => setGo(!go)}>{go ? "Stop" : "Go"}</button>
            <nav className="space-x-4">
                <select
                    className="bg-slate-500 text-white p-4 text-xl rounded"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                >
                    {fonts.sort((a,b) => {
                      if (a < b) return -1
                      else if(a > b) return 1
                      return 0;
                    } ).map((font) => (
                        <option key={font}>{font}</option>
                    ))}
                </select>
                <select
                    className="bg-slate-500 text-white p-4 text-xl rounded"
                    value={midiInput}
                    onChange={(e) => setMidiInput(parseInt(e.target.value))}
                >
                    {midiInputs.sort((a,b) => {
                      if (a < b) return -1
                      else if(a > b) return 1
                      return 0;
                    }).map((input, i) => (
                        <option key={input.id} value={i}>
                            {input.name}
                        </option>
                    ))}
                </select>
            </nav>
            {/* <Claviature
        onClick={(midi:any) => {
          console.log('clickkk');
          setClickedNote(midi);
          if (loaded?.presets) {
            console.log('play', midi);
            const stopHandle = startPresetNote(ctx, loaded.presets[presetIndex], midi);
            setTimeout(() => {
              stopHandle((ctx?.currentTime || 0) + 0.1);
              setClickedNote(undefined);
            }, Math.random() * 1000);
          }
        }}
        options={{
          range: ['A1', 'C6'],
          colorize: [
            {
              keys: activeNotes.map((n) => n.identifier),
              color: 'rgb(34 197 94)',
            },
            ...(clickedNote ? [{ keys: [clickedNote], color: 'rgb(34 197 94)' }] : []),
          ],
        }}
      /> */}
            <section>
                {loaded?.presets.sort((a,b) => {
                      if (a.header.name < b.header.name) return -1
                      else if(a.header.name > b.name) return 1
                      return 0;
                    }).map((preset, i) => (
                    <button
                        key={i}
                        className={`p-2 text-xl rounded-md mb-1 mr-1 ${
                            presetIndex === i ? "bg-green-500" : "bg-slate-800"
                        }`}
                        onClick={() => {
                            setPresetIndex(i);
                            console.log("select preset", preset);
                            /* const midi = toMidi('C4');
              const stopHandle = startPresetNote(ctx, preset, midi); // , (ctx?.currentTime || 0) + 1
              setTimeout(() => stopHandle(), 1000); */
                        }}
                    >
                        {preset.header.name}
                    </button>
                ))}
            </section>
        </div>
    );
}

export default App;
