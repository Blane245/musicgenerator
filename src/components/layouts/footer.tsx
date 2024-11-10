import RoomCompressorDialog from "../../components/dialogs/roomcompressordialog";
import RoomEqualizerDialog from "../../components/dialogs/roomequalizerdialog";
import RoomReverbDialog from "../../components/dialogs/roomreverbdialog";
import { useCMGContext } from "../../contexts/cmgcontext";

// the footer will contain the equalizer
export default function Footer() {
  const { status } = useCMGContext();

  return (
    <div className="page-footer">
      <div className="page-footer-status">{status}</div>
      <RoomReverbDialog />
      <RoomCompressorDialog />
      <RoomEqualizerDialog />
    </div>
  );
}
