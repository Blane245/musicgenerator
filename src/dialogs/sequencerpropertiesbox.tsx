import { SequenceItem } from "classes/sequenceitems";
import DraggablePopup from "panels/draggablepopup";
import ItemTable from "panels/itemtable";
import { ChangeEvent, MouseEvent, useEffect, useState } from "react";
import { SEQUENCEATTRIBUTE, SequenceName, SequenceType } from "types";
import { loadSequenceItems } from "utils/loadsequenceitems";
import { loadValidSequenceNames } from "utils/loadvalidsequencenames";
import toTitleCase from "utils/totitlecase";

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
  const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>([]);
  const [validSequences, setValidSequences] = useState<SequenceName[]>([]);

  // load the valid sequence from the db when this dislog starts up
  useEffect(() => {
    loadValidSequenceNames(attributeType, setValidSequences);
    console.log(`load valid ${attributeType} sequences`);
  }, [attributeType]);

  // when a new sequence name is selected, load its sequence items and
  // then signal the change
  async function handleSequenceNameClick(e: ChangeEvent<HTMLSelectElement>) {
    const sequenceName: string = e.currentTarget.value;
    const name: string = e.currentTarget.name;
    const sequenceItems: SequenceItem[] = await loadSequenceItems(
      attributeType,
      sequenceName
    );
    values.name = sequenceName;
    values.items = sequenceItems;
    // TODO handle stoptime change if this is for the note
    setSequenceItems(sequenceItems);
    handleChange({
      target: { name: name, value: sequenceName },
    } as ChangeEvent<HTMLInputElement>);
  }

  async function reloadItems(e: MouseEvent, name: string) {
    e.preventDefault();
    e.stopPropagation();
    values.items = await loadSequenceItems(attributeType, name);
    setSequenceItems(values.items);
  }

  return (
    <div className="sequencer">
      <div className="name">
        <label>
          Sequence Name:&nbsp;
          <select
            name={name.concat(".name")}
            onChange={(e) => handleSequenceNameClick(e)}
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
        </label>
      </div>
      {!!(sequenceItems.length > 0) && (
        <>
          <div className="reload">
            <button
              style={{ fontSize: "12px", paddingLeft: "5px" }}
              onClick={(e) => reloadItems(e, values.name)}
            >
              Reload
            </button>
          </div>
          <div className="view">
            <button
              style={{ fontSize: "12px", paddingLeft: "5px" }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowItems(true);
              }}
            >
              View
            </button>
            <DraggablePopup
              isOpen={showItems}
              onClose={() => setShowItems(false)}
              headerText={`Items for ${toTitleCase(attributeType)} sequence '${
                values.name
              }' `}
            >
              <ItemTable attributeType={attributeType} items={sequenceItems} />
            </DraggablePopup>
          </div>
        </>
      )}
      <div className="transpose">
        <label>
          &nbsp;Transpositon:&nbsp;
          <input
            name={name + ".transpose"}
            type="number"
            onChange={handleChange}
            value={values.transpose}
          />
        </label>
      </div>
    </div>
  );
}
