import { ChangeEvent, useEffect, useState } from 'react';

import {
  IoMdVolumeHigh,
  IoMdVolumeOff,
  IoMdVolumeLow,
} from 'react-icons/io';
import { useAudioPlayerContext } from '../audioplayercontext';
import CGMFile from '../../../classes/cgmfile';
export interface VolumeControlProps {
  fileContents: CGMFile | null,
}

export const VolumeControl = (props: VolumeControlProps) => {
  const { fileContents } = props;
  const [volume, setVolume] = useState<number>(60);
  const [muteVolume, setMuteVolume] = useState(false);
  const { audioRef } = useAudioPlayerContext();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = muteVolume;
    }
  }, [volume, audioRef, muteVolume]);

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  return (
    <>
        <button 
        onClick={() => setMuteVolume((prev) => !prev)}
        disabled={fileContents != null && fileContents.tracks.length == 0}
                >
          {muteVolume || volume < 5 ? (
            <IoMdVolumeOff size={25} />
          ) : volume < 40 ? (
            <IoMdVolumeLow size={25} />
          ) : (
            <IoMdVolumeHigh size={25} />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          className="volumn"
          onChange={handleVolumeChange}
          style={{
            background: `linear-gradient(to right, #f50 ${volume}%, #ccc ${volume}%)`,
          }}
          disabled={fileContents != null && fileContents.tracks.length == 0}
          />
    </>
  );
};
