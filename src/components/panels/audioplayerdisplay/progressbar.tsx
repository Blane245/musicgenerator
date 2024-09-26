import CMGFile from '../../../classes/cmgfile';
import { useAudioPlayerContext } from '../audioplayercontext';
export interface ProgressBarProps {
  fileContents: CMGFile,
}
export const ProgressBar = (props: ProgressBarProps) => {
  const { fileContents } = props;
  const {
    progressBarRef,
    audioRef,
    timeProgress,
    duration,
    setTimeProgress,
  } = useAudioPlayerContext();

  const handleProgressChange = () => {
    if (audioRef.current && progressBarRef.current) {
      const newTime = Number(progressBarRef.current.value);
      audioRef.current.currentTime = newTime;

      setTimeProgress(newTime);

      // if progress bar changes while audio is on pause
      progressBarRef.current.style.setProperty(
        '--range-progress',
        `${(newTime / duration) * 100}%`
      );
    }
  };

  const formatTime = (time: number | undefined): string => {
    if (typeof time === 'number' && !isNaN(time)) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);

      // Convert to string and pad with leading zeros if necessary
      const formatMinutes = minutes.toString().padStart(2, '0');
      const formatSeconds = seconds.toString().padStart(2, '0');

      return `${formatMinutes}:${formatSeconds}`;
    }
    return '00:00';
  };

  return (
    <>
      <span>{formatTime(timeProgress)}</span>
      <input
        className="max-w-[80%] bg-gray-300"
        ref={progressBarRef}
        type="range"
        defaultValue="0"
        onChange={handleProgressChange}
      />
      <span>{formatTime(duration)}</span>
    </>
  );
};
