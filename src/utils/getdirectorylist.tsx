// get the list of soundfont files either from local storage or from the server
import { Dispatch, SetStateAction } from "react";
import { type FSResponse } from "../types";
import {fetchFSData} from "./fetchdata";
import { debug } from "./debug";

export async function getDirectoryList(
  directory: string,
  typeFilter: string[],
  setList: React.Dispatch<React.SetStateAction<string[]>>,
  setStatus: Dispatch<SetStateAction<string>>
) {
  if (directory == "") {
    setList([]);
    return;
  }
  const fetchUri = `/directory/list?name=${directory}`;
  const response: FSResponse = await fetchFSData(fetchUri, "GET");
  debug.info("getDirectoryList: response", response);
  if (!response) {
    return;
  }
  if (response.error) {
    setStatus(`getdirectorylist fetchdata error ${response.status}`);
    return;
  }
  if (response.list) {
    debug.info("getdirectoryList:", response.list);
    const list = response.list.map((item: { name: string; path: string }) => {
      if (typeFilter.length == 0) return item.name;
      const nameParts: string[] = item.name.split(".");
      if (
        nameParts.length == 0 ||
        typeFilter.indexOf(nameParts[nameParts.length-1]) >= 0
      )
        return item.name;
    }).filter((f) => f != undefined);
    setList(list);
    setStatus(`${list.length} Files present in ${directory}.`);
  }
}
