// get the list of soundfont files either from local storage or from the server
import { type FSResponse } from "../types";
import {fetchFSData} from "./fetchdata";

export async function getDirectoryList(
  directory: string,
  typeFilter: string[],
  setList: Function,
  setStatus: Function
) {
  if (directory == "") {
    setList([]);
    return;
  }
  const fetchUri = `/directory/list?name=${directory}`;
  const response: FSResponse = await fetchFSData(fetchUri, "GET");
  // console.log("getdirectory response", response);
  if (!response) {
    return;
  }
  if (response.error) {
    setStatus(`getdirectorylist fetchdata error ${response.status}`);
    return;
  }
  if (response.list) {
    // console.log("getdirectory list", response.list);
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
