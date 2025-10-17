import { DBRESPONSETYPE, DbResponseType, DbSequenceItem, DbSequenceType, DbSequenceValidNamesType, SEQUENCEATTRIBUTE, SequenceName } from "types";
import {fetchDBData} from "./fetchdata";
import { SequenceItem } from "classes/sequenceitems";

// get the list of sequences of the specified type that have non-zero length items
export default async function getSequenceItems (type: SEQUENCEATTRIBUTE, name: string): Promise<SequenceItem[]> {
    const response: DbResponseType = await fetchDBData( 
        `/${type}/${name}`,'GET');
    if (!response || response.type == DBRESPONSETYPE.error) {
        return [];
    }
    // get the encoded item list and decode it
    const value: string = (response as DbSequenceType).value.value;
    const items:SequenceItem[] = JSON.parse(value);
    return items;
}