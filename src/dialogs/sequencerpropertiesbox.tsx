import { SequenceItem } from "classes/sequenceitems";
import DraggablePopup from "panels/draggablepopup";
import { ChangeEvent, useEffect, useState } from "react";
import { toNote } from "sfcomponents/util";
import { SEQUENCEATTRIBUTE, SequenceName, SequenceType } from "types";
import { loadValidSequenceNames } from "utils/loadvalidsequencenames";
import toTitleCase from "utils/totitlecase";

type ItemTableProps = {
  attributeType: SEQUENCEATTRIBUTE;
  items: SequenceItem[];
};
function ItemTable(props: ItemTableProps): JSX.Element {
  const { attributeType, items } = props;

  const getItemHeader = (
    attributeType: SEQUENCEATTRIBUTE,
    column: number
  ): string => {
    if (column == 1) return "Beats";
    switch (attributeType) {
      case SEQUENCEATTRIBUTE.note:
        return "Note";
      case SEQUENCEATTRIBUTE.speed:
        return "BPM";
      case SEQUENCEATTRIBUTE.attack:
        return "Attack";
      case SEQUENCEATTRIBUTE.duration:
        return "Duration";
      case SEQUENCEATTRIBUTE.volume:
        return "Volume";
      case SEQUENCEATTRIBUTE.pan:
        return "Pan";
      default:
        return "";
    }
  };
  const getItemValue = (
    attributeType: SEQUENCEATTRIBUTE,
    item: SequenceItem,
    column: number
  ): string => {
    if (column == 1) return item.beats.toString();
    if (attributeType == SEQUENCEATTRIBUTE.note) return toNote(item.value);
    return item.value.toString();
  };
  return (
    <table>
      <thead>
        <tr>
          <th>{getItemHeader(attributeType, 0)}</th>
          <th>{getItemHeader(attributeType, 1)}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item: SequenceItem, i) => (
          <tr key={`item-${i}`}>
            <td>{getItemValue(attributeType, item, 0)}</td>
            <td>{getItemValue(attributeType, item, 1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type SequencerProperitesBoxProps = {
  attributeType: SEQUENCEATTRIBUTE;
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
  const { attributeType, name, values, handleChange } = props;
  const [showItems, setShowItems] = useState<boolean>(false);
  const [validSequences, setValidSequences] = useState<SequenceName[]>([]);
  const [showListButton, setShowListButton] = useState<boolean>(false);

  // load the valid sequence from the db when this dislog starts up
  useEffect(() => {
    loadValidSequenceNames(attributeType, setValidSequences);
  }, [attributeType]);

  // when the name of the sequence changes, activate the list button
  useEffect(() => {
    setShowListButton(values.items.length != 0);
  }, [values.name]);

  return (
    <div className="sequencer">
      <div className="nametitle">Name</div>
      <div className="listbuttontitle"></div>
      {!!(attributeType == SEQUENCEATTRIBUTE.note) && (
        <div className="transposetitle">Transpose</div>
      )}
      <div className="name">
        <select
          name={name.concat(".name")}
          onChange={handleChange}
          value={values.name}
        >
          <option>&nbsp;</option>
          {validSequences.map((s) => {
            return (
              <option key={name.concat("-").concat(s.name.toString())}>
                {s.name}
              </option>
            );
          })}
        </select>
        &nbsp;
      </div>
      {/* <div className="listbutton">
        <button onClick={() => setShowItems(true)}>List</button>
      </div> */}
      {/* <div className="listtitle">{`Sequence items for ${values.name}`}</div> */}
      {!!(attributeType == SEQUENCEATTRIBUTE.note) && (
        <label className="transpose">
          <input
            name={name.concat(".transpose")}
            type="number"
            min={-127}
            max={127}
            onChange={handleChange}
            value={values.transpose}
          />
          <span style={{ fontSize: "small" }}>&nbsp;{"[-127,127]"}</span>
        </label>
      )}
      {/* {!!showItems && (
        <div className="list">
          <div className="modal">
            <div className="modalheader"></div>
            <div className="modalbody">
              <ItemTable
                attributeType={attributeType}
                items={(values as SequenceType).items}
              />
            </div>
            <div className="modalfooter">
              <button className="okbutton" onClick={() => setShowItems(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )} */}
      <div className="listbutton">
        <button onClick={() => setShowItems(true)}>List Sequence Items</button>
        {!!showItems && (
          <>
          show items on
          <DraggablePopup
            isOpen={showItems}
            onClose={() => setShowItems(false)}
            headerText={`Items for ${toTitleCase(attributeType)} sequence '${
              values.name
            }' `}
          >
            <ItemTable attributeType={attributeType} items={values.items} />
          </DraggablePopup>
          </>
        )}
      </div>
    </div>
  );
}
