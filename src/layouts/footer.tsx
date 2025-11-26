// The CMG page footer containing the status message and room modulators
import { useCMGContext } from "cmgcontext";
import RoomCompressorDialog from "dialogs/room/roomcompressordialog";
import RoomEqualizerDialog from "dialogs/room/roomequalizerdialog";
import RoomReverbDialog from "dialogs/room/roomreverbdialog";
import RoomVolumeDialog from "dialogs/room/roomvolumedialog";

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
