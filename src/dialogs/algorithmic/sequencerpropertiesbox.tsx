import { SequenceItem } from "types";
import DraggablePopup from "components/draggablepopup";
import ItemTable from "components/itemtable";
import { ChangeEvent, MouseEvent, useEffect, useState } from "react";
import { SEQUENCEATTRIBUTE, SequenceName, SequenceType } from "types";
import { loadSequenceItems } from "utils/loadsequenceitems";
import { loadValidSequenceNames } from "utils/loadvalidsequencenames";
import toTitleCase from "utils/totitlecase";
import { toNote } from "sfcomponents/util";

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
    // console.log(`load valid ${attributeType} sequences`);
  }, [attributeType]);

  useEffect(() => {
    async function load() {
      const sequenceItems: SequenceItem[] = await loadSequenceItems(
        attributeType,
        values.name
      );
      values.items = sequenceItems;
      setSequenceItems(sequenceItems);
    }
    if (sequenceItems.length == 0) load();
  }, [values.name]);

  // when a new sequence name is selected, load its sequence items and
  // then signal the change
  async function handleSequenceNameClick(e: ChangeEvent<HTMLSelectElement>) {
    const sequenceName: string = e.currentTarget.value;
    const newItems: SequenceItem[] = await loadSequenceItems(
      attributeType,
      sequenceName
    );
    values.name = sequenceName;
    values.items = newItems;
    setSequenceItems(newItems);
    // passing the original 'e' seems to lose the targete.value, so it is reconstructed here
    handleChange({
      target: { name: `${name.concat(".name")}`, value: sequenceName },
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
      <div className="transform">
        <label>
          &nbsp;Reverse Sequence:&nbsp;
          <input
            name={name + ".reverseSequence"}
            type="checkbox"
            onChange={(e)=>handleChange(e)}
            checked={values.reverseSequence}
          />
        </label>
        <label>
          &nbsp;Reflect Sequence:&nbsp;
          <input
            name={name + ".reflectSequence"}
            type="checkbox"
            onChange={(e)=>handleChange(e)}
            checked={values.reflectSequence}
          />
        </label>
        <label>
          &nbsp;Reflect Pitch (0-127):&nbsp;
          <input
            name={name + ".reflectPitch"}
            type="number"
            min={0}
            max={127}
            onChange={(e)=>handleChange(e)}
            value={values.reflectPitch}
          />
        </label>
        <span>&nbsp;{toNote(values.reflectPitch)}</span>
      </div>
    </div>
  );
}
