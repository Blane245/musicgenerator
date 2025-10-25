import { SequenceItem } from "classes/sequenceitems";
import { toNote } from "sfcomponents/util";
import { SEQUENCEATTRIBUTE } from "types";

type ItemTableProps = {
  attributeType: SEQUENCEATTRIBUTE;
  items: SequenceItem[];
};
export default function ItemTable(props: ItemTableProps): JSX.Element {
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

