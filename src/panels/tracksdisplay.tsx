// display a track's controls and time line
// the time line contains the visible generator icons
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import GeneratorDialog from "dialogs/generatordialog";
import { useEffect, useState } from "react";
import GeneratorIcons from "./generatoricons";
import TrackControls from "./trackcontrols";

export default function TracksDisplay() {
  const { fileContents, generatorType, timelineWidth, controlWidth } = useCMGContext();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [enableGeneratorDialog, setEnableGeneratorDialog] =
    useState<number>(-1);

  useEffect(() => {
    setTracks(fileContents.tracks);
    setEnableGeneratorDialog(-1);
  }, [fileContents.tracks]);

  return (
    <>
      {tracks.map((t, i) => {
        return (
          <>
            <div 
            className='track-control'
            key={`track-control:${t.name}`}
             style={{width: controlWidth}}>
              <TrackControls
                tracks={tracks}
                track={t}
                trackIndex={i}
                setEnableGeneratorDialog={setEnableGeneratorDialog}
              />
            </div>
            <div className='track-display'
              key={`track-display:${t.name}`}
              id={`track-display:${t.name}`}
              style={{width: timelineWidth}}
            >
              <GeneratorIcons track={t} key={`track-generators:${t.name}`} />
            </div>
          </>
        );
      })}
      {enableGeneratorDialog >= 0 ? (
        <GeneratorDialog
          key={`generator-dialog`}
          track={tracks[enableGeneratorDialog]}
          generatorType={generatorType}
          generatorIndex={-1}
          setVisible={() => {
            setEnableGeneratorDialog(-1);
          }}
        />
      ) : null}
    </>
  );
}
