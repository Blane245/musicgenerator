import {
  DBRESPONSETYPE,
  DbResponseType,
  DbSequenceValidNamesType,
  SEQUENCEATTRIBUTE,
} from "types";
import { fetchDBData } from "./fetchdata";

//ginve the name and sequence type, get the sequenceitsm from the database
export function loadValidSequenceNames(
  sequenceType: SEQUENCEATTRIBUTE,
  setValidSequenceNames: Function
) {
  const load = async () => {
    const response: DbResponseType = await fetchDBData(
      `/${sequenceType}/valid`,
      "GET"
    );
    if (response.type == DBRESPONSETYPE.error) setValidSequenceNames([]);
    setValidSequenceNames((response as DbSequenceValidNamesType).value);
  };
  load();
}
