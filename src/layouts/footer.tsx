// The CMG page footer containing the status message and room modulators
import { useCMGContext } from "cmgcontext";
import RoomCompressorDialog from "dialogs/roomcompressordialog";
import RoomEqualizerDialog from "dialogs/roomequalizerdialog";
import RoomReverbDialog from "dialogs/roomreverbdialog";
import RoomVolumeDialog from "dialogs/roomvolumedialog";

// the footer will contain the equalizer
export default function Footer() {
  const { status } = useCMGContext();

  return (
    <div className="footer">
      <div className="status">{status}</div>
      <RoomVolumeDialog />
      <RoomReverbDialog />
      <RoomCompressorDialog />
      <RoomEqualizerDialog />
    </div>
  );
}
