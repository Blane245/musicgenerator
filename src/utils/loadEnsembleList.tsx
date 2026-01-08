import { DbEnsembleListType, DbResponseType } from "types";
import { fetchDBData } from "./fetchdata";

  export default async function loadEnsembleList(setEnsembleList: Function) {
    const value: DbResponseType = await fetchDBData("/ensembles", "GET");
    if (value.type == "ensemblelist") {
      setEnsembleList((value as DbEnsembleListType).value);
    } else {
      alert('CMG dataserver is not running');
    }
  }

