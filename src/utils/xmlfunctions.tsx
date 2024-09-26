export function getDocElement(object: Document, item: string): Element {
    const itemElement: Element | null = object.querySelector(item);
    if (!itemElement)
        throw new Error(`Item '${item}' not found in document`);
    return itemElement;
}

export function getElementElement(object: Element, item: string): Element {
    const itemElement: Element | null = object.querySelector(item);
    if (!itemElement)
        throw new Error(`Item '${item}' not found in element '${object.nodeName}'`);
    return itemElement;
}

export function getAttributeValue (object: Element, item: string, outputType: string): string | number {
    const itemElement: HTMLElement | null = object.attributes[item];
    if (!itemElement)
        throw new Error(`Item '${item}' not found in document`)

    const itemText: string = itemElement.value;
    switch (outputType) {
        case 'string':
            return itemText ;
        case 'int':
            return parseInt(itemText);
        case 'float':
            return parseFloat(itemText);
        default:
            throw new Error(`Invalid output type '${outputType}' for item '${item}'`);
    }
}
