// get the list of soundfont files either from local storage or from the server
import fetchData from "./fetchdata";

export function getSFFileList(
  uri: string,
  setSFFileList: Function,
  setStatus: Function
) {
    async function getFromServer() {
      let newList: string[] = [];
      const fetchUri = `${uri}/list`;
      const response = await fetchData(fetchUri, "GET");
      if (!response.error && response.list.length != 0) {
        newList = response.list;
        newList.unshift("select a file");
        setSFFileList(newList);
        setStatus(`Soundfont file list loaded from the server @${fetchUri} `);
      } else {
        setSFFileList([]);
        setStatus(`No Soundfont files found on the server @${fetchUri} `);
      }
    }
    getFromServer();
}
