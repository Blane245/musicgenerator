import { SequenceValues } from "classes/algorithmvalues";
import {
  AttackItem,
  DurationItem,
  NoteItem,
  PanItem,
  SequenceItem,
  SpeedItem,
  VolumeItem,
} from "classes/sequenceitems";
import { ChangeEvent, useEffect, useState } from "react";
import { NoteType, SEQUENCEATTRIBUTE, SequenceName, SequenceType } from "types";
import { loadValidSequenceNames } from "utils/loadvalidsequencenames";

type ItemTableProps = {
  sequenceType: SEQUENCEATTRIBUTE;
  items: SequenceItem[];
};
function ItemTable(props: ItemTableProps): JSX.Element {
  const { sequenceType, items } = props;

  const getItemHeader = (
    sequenceType: SEQUENCEATTRIBUTE,
    column: number
  ): string => {
    switch (sequenceType) {
      case SEQUENCEATTRIBUTE.note:
        if (column == 0) return "Note";
        return "Beats";
      case SEQUENCEATTRIBUTE.speed:
        if (column == 0) return "BPM";
        return "Time (sec)";
      case SEQUENCEATTRIBUTE.attack:
        if (column == 0) return "Attack";
        return "Time (sec)";
      case SEQUENCEATTRIBUTE.duration:
        if (column == 0) return "Duration";
        return "Time (sec)";
      case SEQUENCEATTRIBUTE.volume:
        if (column == 0) return "Volume";
        return "Time (sec)";
      case SEQUENCEATTRIBUTE.pan:
        if (column == 0) return "Pan";
        return "Time (sec)";
      default:
        return "";
    }
  };
  const getItemValue = (
    sequenceType: SEQUENCEATTRIBUTE,
    item: SequenceItem,
    column: number
  ): string => {
    switch (sequenceType) {
      case SEQUENCEATTRIBUTE.note:
        if (column == 0) return (item as NoteItem).note;
        return (item as NoteItem).beats.toString();
      case SEQUENCEATTRIBUTE.speed:
        if (column == 0) return (item as SpeedItem).speed.toString();
        return (item as SpeedItem).time.toString();
      case SEQUENCEATTRIBUTE.attack:
        if (column == 0) return (item as AttackItem).attack.toString();
        return (item as AttackItem).time.toString();
      case SEQUENCEATTRIBUTE.duration:
        if (column == 0) return (item as DurationItem).duration.toString();
        return (item as DurationItem).time.toString();
      case SEQUENCEATTRIBUTE.volume:
        if (column == 0) return (item as VolumeItem).volume.toString();
        return (item as VolumeItem).time.toString();
      case SEQUENCEATTRIBUTE.pan:
        if (column == 0) return (item as PanItem).pan.toString();
        return (item as PanItem).time.toString();
      default:
        return "";
    }
  };
  return (
    <table>
      <tr>
        <th>{getItemHeader(sequenceType, 0)}</th>
        <th>{getItemHeader(sequenceType, 1)}</th>
      </tr>
      {items.map((item: SequenceItem, i) => (
        <tr key={`item-${i}`}>
          <td>{getItemValue(sequenceType, item, 0)}</td>
          <td>{getItemValue(sequenceType, item, 1)}</td>
        </tr>
      ))}
    </table>
  );
}

type SequencerProperitesBoxProps = {
  sequenceType: SEQUENCEATTRIBUTE;
  name: string;
  values: SequenceType;

  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
};

// build and manage the ui for oscillator attributes
export default function SequencerPropertiesBox(
  props: SequencerProperitesBoxProps
): JSX.Element {
  const { sequenceType, name, values, handleChange } =
    props;
  const [showItems, setShowItems] = useState<boolean>(false);
  const [validSequences, setValidSequences] = useState<SequenceName[]>([]);

  // load the valid sequence from the db when this dislog starts up
  useEffect(()=>{
    loadValidSequenceNames (sequenceType, setValidSequences);
  }, [sequenceType])

  return (
    <div className="sequencer">
      <div className="nametitle">Name</div>
      <div className="listtitle">List Sequence</div>
      {!!(sequenceType == SEQUENCEATTRIBUTE.note) && 
      <div className="transposetitle">Transpose</div>}
      <div className="name">
        <select name={name.concat(".name")} onChange={handleChange} value={name}>
          {validSequences.map((s) => {
            return (
              <option key={name.concat("-").concat(s.toString())}>{s.name}</option>
            );
          })}
        </select>
        &nbsp;
      </div>
      <div className="list">
        <button className="listbutton" onClick={()=> setShowItems(true)}>
          List
        </button>
      </div>
      {!!(sequenceType == SEQUENCEATTRIBUTE.note) && (
        <label className="transpose">
          &nbsp;Transpose&nbsp;
          <input
            name={name.concat(".transpose")}
            type="number"
            min={-127}
            max={127}
            onChange={handleChange}
            value={(values as NoteType).transpose}
          />
          <span style={{ fontSize: "small" }}>&nbsp;{"[-127,127]"}</span>
        </label>
      )}
      {!!showItems && (
        <div className="modal">
          <div className="modalheader">{`Sequence items for ${name}`}</div>
          <div className="modalbody">
            <ItemTable sequenceType={sequenceType} items={(values as SequenceType).items} />
          </div>
          <div className="modalfooter">
            <button className="okbutton" onClick={() => setShowItems(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
