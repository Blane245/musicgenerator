import { Dispatch, SetStateAction } from "react";
import { DbEnsembleListType, DbResponseType, EnsembleType } from "types";
import { fetchDBData } from "./fetchdata";

  export default async function loadEnsembleList(setEnsembleList: Dispatch<SetStateAction<EnsembleType[]>>) {
    const value: DbResponseType = await fetchDBData("/ensembles", "GET");
    if (value.type == "ensemblelist") {
      setEnsembleList((value as DbEnsembleListType).value);
    } else {
      alert('CMG dataserver is not running');
    }
  }

