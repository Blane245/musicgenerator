import { DBRESPONSETYPE, DbResponseType, DbSequenceValidNamesType, SEQUENCEATTRIBUTE, SequenceName } from "types";
import {fetchDBData} from "./fetchdata";

// get the list of sequences of the specified type that have non-zero length items
export default async function getValidSequenceList (type: SEQUENCEATTRIBUTE): Promise<SequenceName[]> {
    const response: DbResponseType = await fetchDBData( 
        `/${type}/valid`,'GET');
    if (!response || response.type == DBRESPONSETYPE.error) {
        return [];
    }
    // get the list of valid sequence names
    const value: SequenceName[] = (response as DbSequenceValidNamesType).value;
    return value;
}