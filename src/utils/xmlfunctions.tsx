// utilities that access a document or element
export function getDocElement(object: Document, item: string): Element {
  const itemElement: Element | null = object.querySelector(item);
  if (!itemElement) throw new Error(`Item '${item}' not found in document`);
  return itemElement;
}

export function getElementElement(object: Element, item: string): Element {
  const itemElement: Element | null = object.querySelector(item);
  if (!itemElement)
    throw new Error(`Item '${item}' not found in element '${object.nodeName}'`);
  return itemElement;
}

export function getAttributeValue(
  object: Element,
  item: string,
  outputType: string
): string | number | boolean {
  const itemAttr: Attr | null = object.attributes.getNamedItem(item);
  if (!itemAttr) throw new Error(`Item '${item}' not found in document`);

  const itemText: string = itemAttr.value;
  switch (outputType) {
    case "string":
      return itemText;
    case "int":
      return parseInt(itemText);
    case "float":
      return parseFloat(itemText);
    case "boolean":
      return itemText == "true";
    default:
      throw new Error(`Invalid output type '${outputType}' for item '${item}'`);
  }
}

// export function addModulationAttributes(
//   doc: XMLDocument,
//   name: string,
//   attributes: OscillatorType
// ): Element {
//   const aElement: Element = doc.createElement(name);
//   aElement.setAttribute("type", attributes.type);
//   aElement.setAttribute("center", attributes.center.toString());
//   aElement.setAttribute("frequency", attributes.frequency.toString());
//   aElement.setAttribute("amplitude", attributes.amplitude.toString());
//   aElement.setAttribute("phase", attributes.phase.toString());
//   return aElement;
// }

// export function getModulationAttributes(
//   elem: Element,
//   name: string
// ): OscillatorType {
//   const attrElem: Element = getElementElement(elem, name);
//   const result: OscillatorType = {
//     type: MODULATOR.SINE,
//     center: 0,
//     frequency: 0,
//     amplitude: 0,
//     phase: 0,
//   };
//   result.type = getAttributeValue(
//     attrElem,
//     "type",
//     "string"
//   ) as MODULATOR;
//   result.center = getAttributeValue(
//     attrElem,
//     "center",
//     "float"
//   ) as number;
//   result.frequency = getAttributeValue(
//     attrElem,
//     "frequency",
//     "float"
//   ) as number;
//   result.amplitude = getAttributeValue(
//     attrElem,
//     "amplitude",
//     "float"
//   ) as number;
//   result.phase = getAttributeValue(attrElem, "phase", "float") as number;
//   return result;
// }

