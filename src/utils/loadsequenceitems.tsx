import { SequenceItem } from "classes/sequenceitems";
import { DBRESPONSETYPE, DbResponseType, DbSequenceType, SEQUENCEATTRIBUTE } from "types";
import { fetchDBData } from "./fetchdata";

//ginve the name and sequence type, get the sequenceitsm from the database
export async function loadSequenceItems (sequenceType: SEQUENCEATTRIBUTE, name: string): Promise<SequenceItem[]> {
    const response: DbResponseType = await fetchDBData (`/${sequenceType}/${name}`, 'GET');
    if (response.type == DBRESPONSETYPE.error) return [];
        // decode the value
        const items: SequenceItem[] = JSON.parse((response as DbSequenceType).value.value);
        return items;
}