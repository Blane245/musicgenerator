// The CMG page footer containing the status message and room modulators
import { useCMGContext } from "../cmgcontext";
import RoomCompressorDialog from "../dialogs/roomcompressordialog";
import RoomEqualizerDialog from "../dialogs/roomequalizerdialog";
import RoomVolumeDialog from "../dialogs/roomvolumedialog";

// the footer will contain the equalizer
export default function Footer() {
  const { status } = useCMGContext();

  return (
    <div className="page-footer">
      <div className="page-footer-status">{status}</div>
      <RoomVolumeDialog />
      <RoomCompressorDialog />
      <RoomEqualizerDialog />
    </div>
  );
}
