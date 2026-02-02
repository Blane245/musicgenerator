// The CMG page footer containing the status message and room modulators
import { useCMGContext } from "cmgcontext";

// the footer will contain the equalizer
export default function Footer() {
  const { status } = useCMGContext();

  return (
    <div className="page-footer">
      <div className="status">{status}</div>
      {/* <RoomVolumeDialog />
      <RoomReverbDialog />
      <RoomCompressorDialog />
      <RoomEqualizerDialog /> */}
    </div>
  );
}
