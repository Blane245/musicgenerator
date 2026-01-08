import CMG2 from "assets/CGM2.svg";
import { useEffect, useState, type JSX } from "react";
import { GoArrowLeft, GoArrowRight, GoArrowUp } from "react-icons/go";
import {fetchFSData} from "utils/fetchdata";
import {
  DirectoryEntry,
  ENTRYTYPE,
  FSEntry,
  FSList,
  FSResponse,
} from "../types";

type FileDialogProps = {
  title: string; // title of the window
  action: string; // Save or Open
  fileTypes: string[]; // allowed extents for files
  directory: string; // starting directory
  setDirectory: Function; // the last directory the user picked
  setFile: Function; // the name of the file picked, or blank if none
  setStatus: Function;
  setMode: Function; // blank to cause dialog to disappear
};
// a dialog for the use to select a file from a list, or enter a new one
export default function FileDialog(props: FileDialogProps): JSX.Element {
  const {
    title,
    action,
    fileTypes,
    directory,
    setDirectory,
    setFile,
    setStatus,
    setMode,
  } = props;
  const [directoryList, setDirectoryList] = useState<DirectoryEntry[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<string>(directory);
  const [selectedFile, setSelectedFile] = useState<string>(directory);
  const [filesystemDirectory, setFilesystemDirectory] = useState<
    { mountPoint: string; list: string[] }[]
  >([]);
  const [error, setError] = useState<string>("");
  const [directoryQueue, setDirectoryQueue] = useState<string[]>([]);
  const [queueLocation, setQueueLocation] = useState<number>(0);
  const [enteredDirectory, setEnteredDirectory] = useState<string>("");
  const [enteredFile, setEnteredFile] = useState<string>("");
  const [disableBack, setDisableBack] = useState<boolean>(true);
  const [disableForward, setDisableForward] = useState<boolean>(true);
  const [disableUp, setDisableUp] = useState<boolean>(true);

  // on entry build the filesystem directory
  // this requires getting all of the mount points and assembling the
  // high level directory for each mount point
  useEffect(() => {
    setSelectedFile("");
    setDirectoryList([]);
    setEnteredDirectory(directory);
    try {
      const mountPoints: string[] = ["C:\\", "D:\\", "E:\\"];
      // clear the filesystem tag list
      // const tag: HTMLElement | null = document.getElementById("filesystem");
      // if (tag) {
      //   while (tag.firstChild) {
      //     tag.firstChild.remove();
      //   }
      // }
      let newFSDirectory: { mountPoint: string; list: string[] }[] = [];
      mountPoints.forEach((mountPoint: string) => {
        getDirectoryList(mountPoint).then((response: FSResponse) => {
          if (!response) {
            setError(`Error reading directory '${mountPoint}'`);
            setFilesystemDirectory([]);
            return;
          }
          if (response.error) {
            setError(
              response.status
                ? response.status
                : `Error while retrieving directory list for '${mountPoint}'`
            );
            setFilesystemDirectory([]);
            return;
          }
          if (!response.list) {
            setError(`No entries in directory '${mountPoint}`);
            return;
          }
          const list: string[] = [];
          response.list.forEach((entry: DirectoryEntry) => {
            if (
              entry.type == ENTRYTYPE.Directory ||
              entry.type == ENTRYTYPE.SymbolicLink
            ) {
              list.push(entry.name);
            }
          });

          // every time a new mountpoint is added sort it into the total
          // list
          newFSDirectory.push({ mountPoint, list });
          newFSDirectory = sortFS(newFSDirectory);
          setFilesystemDirectory(newFSDirectory);
        });
      });
    } catch (e: any) {
      setError(
        `Error while ready filesystem directory ${(e as Error).message}`
      );
    }
  }, []);

  useEffect(() => {
    try {
      if (selectedDirectory == "") {
        setDirectoryList([]);
        return;
      }
      getDirectoryList(selectedDirectory).then((response: FSResponse) => {
        if (response.error) {
          setError(
            response.status
              ? response.status
              : `Error while retrieving directory list for ${selectedDirectory}`
          );
          setDirectoryList([]);
          return;
        }
        if (!response.list) {
          setError(`No entries in directory ${selectedDirectory}`);
          return;
        }

        // push the selected directory in the location queue
        setError(`Directory loaded: '${selectedDirectory}'`);
        setDirectoryList(response.list);
        if (directoryQueue.indexOf(selectedDirectory) < 0) {
          const newQueue: string[] = [...directoryQueue];
          newQueue.push(selectedDirectory);
          setDirectoryQueue(newQueue);
          setQueueLocation(newQueue.length - 1);
          setNavigationButtons(newQueue.length - 1, newQueue);
          // console.log("new location queue", newQueue);
        }
      });
    } catch (error: any) {
      setError((error as Error).message);
      setDirectoryList([]);
      setSelectedFile("");
    }
  }, [selectedDirectory]);

  useEffect(() => {
    if (enteredDirectory != "") setSelectedDirectory(enteredDirectory);
  }, [enteredDirectory]);

  useEffect(() => {
    setSelectedFile(enteredFile);
  }, [enteredFile]);
  // when the filesystem directory list is updated, sort it by
  // mount point and then by directory name
  // remove double back slashes
  // this will be called once each time a new mount point is added
  // to the filesystem
  function sortFS(FS: FSList): FSList {
    let newFS: FSList = [];

    // sort the lists within each mount point
    FS.forEach((entry: FSEntry) => {
      const mpList: string[] = entry.list.sort((a: string, b: string) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });
      newFS.push({ mountPoint: entry.mountPoint, list: mpList });
    });

    // sort the mountpoints
    newFS = newFS.sort((a: FSEntry, b: FSEntry) => {
      if (a.mountPoint < b.mountPoint) return -1;
      if (a.mountPoint > b.mountPoint) return 1;
      return 0;
    });

    // remove all of the double slashes
    newFS.forEach((entry: FSEntry) => {
      entry.mountPoint = entry.mountPoint.replace(/\\\\/g, "\\");
      entry.list.forEach((directory: string) => {
        directory = directory.replace(/\\\\/g, "\\");
      });
    });
    return newFS;
  }

  // retrive the filtered directory list from the local server
  async function getDirectoryList(directory: string): Promise<FSResponse> {
    const uri: string = `/directory/list?name=${directory}`;
    const response: FSResponse = await fetchFSData(uri, "GET");
    if (!response)
      return Promise.resolve({ error: true, status: "Local server not responding", list: [] });
    if (response.error)
      return Promise.resolve( {
        error: true,
        status: response.status
          ? response.status
          : "Local server has unknown error.",
        list: [],
      });
    if (!response.list)
      return  Promise.resolve( {
        error: true,
        status: `No directory list was returned from the local server`,
        list: [],
      });

    // trim the directory list down to only directories and files that are match types
    // first sort the entire list
    let list: DirectoryEntry[] = response.list.sort(
      (a: DirectoryEntry, b: DirectoryEntry) => {
        const aIsFile: boolean = a.type == ENTRYTYPE.File;
        const aIsDirectory: boolean =
          a.type == ENTRYTYPE.Directory || a.type == ENTRYTYPE.SymbolicLink;
        const bIsFile: boolean = b.type == ENTRYTYPE.File;
        const bIsDirectory: boolean =
          b.type == ENTRYTYPE.Directory || b.type == ENTRYTYPE.SymbolicLink;
        // sort files ahead of directory
        if (aIsFile && bIsDirectory) return -1;
        if (aIsDirectory && bIsFile) return 1;
        // sort the files
        if (aIsFile && bIsFile) {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        }
        if (aIsDirectory && bIsDirectory) {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        }
        if (!aIsFile && !aIsDirectory) return 1;
        if (!bIsFile && !bIsDirectory) return -1;
        return 1; // default to greater
      }
    );

    // now remove things not wanted
    list = list.filter((entry: DirectoryEntry) => {
      const isFile: boolean = entry.type == ENTRYTYPE.File;
      const isDirectory: boolean =
        entry.type == ENTRYTYPE.Directory ||
        entry.type == ENTRYTYPE.SymbolicLink;
      if (!isFile && !isDirectory) return false;
      if (isDirectory) return true;
      if (!isFile) return false;
      // type is File, so check the extension
      if (!fileTypes || fileTypes.length == 0) return true;
      const nameParts: string[] = entry.name.split(".");
      const thisExtent: string = nameParts[nameParts.length - 1];
      return fileTypes.indexOf(thisExtent) >= 0;
    });

    // change all \\ to \ and all / to \
    list = list.map((entry: DirectoryEntry) => {
      return {
        name: entry.name.replace(/\\\\|\//g, "\\"),
        path: entry.path.replace(/\\\\|\//g, "\\"),
        type: entry.type,
      };
    });
    // setDirectoryList(list);
    return  Promise.resolve(  {
      error: false,
      status: "",
      list: response.list,
    });
  }

  // load the directory list whenever the current directory changes
  function onAction() {
    // selectedFile must has an extent
    const nameParts: string[] = selectedFile.split('.');
    if (nameParts.length < 2) {
      setError(`File Name must include an extent`);
      return;
  }
    const extendedFile: string = selectedFile.includes(selectedDirectory)? selectedFile: selectedDirectory + '\\' + selectedFile;
    setFile(extendedFile.replace(/\\\\|\//g, '\\'));
    setDirectory(selectedDirectory.replace(/\\\\|\//g, '\\'));
    setStatus("");
    setMode("");
  }

  function onExit() {
    setFile("");
    setMode("");
  }

  function setNavigationButtons(location: number, queue: string[]) {
    setDisableBack(location <= 0);
    setDisableForward(location > queue.length - 2);
    if (location < 0 || location > queue.length - 1) setDisableUp(true);
    else setDisableUp(queue[location].split("\\").length <= 1);
  }

  function onBack() {
    if (queueLocation > 0) {
      const newDirectory: string = directoryQueue[queueLocation - 1];
      setEnteredDirectory(newDirectory);
      setQueueLocation((prev) => {
        return prev - 1;
      });
      setNavigationButtons(queueLocation - 1, directoryQueue);
    } else setNavigationButtons(queueLocation, directoryQueue);
  }

  function onForward() {
    if (queueLocation < directoryQueue.length - 1) {
      const newDirectory: string = directoryQueue[queueLocation + 1];
      setEnteredDirectory(newDirectory);
      setQueueLocation((prev) => {
        return prev + 1;
      });
      setNavigationButtons(queueLocation + 1, directoryQueue);
    } else setNavigationButtons(queueLocation, directoryQueue);
  }

  function onUp() {
    const nameParts: string[] = selectedDirectory.split("\\");
    if (nameParts.length > 1) {
      const newDirectory: string = nameParts
        .slice(0, nameParts.length - 1)
        .join("\\");
      setEnteredDirectory(newDirectory);
      setDirectoryQueue([newDirectory]);
      setNavigationButtons(0, [newDirectory]);
    } else setNavigationButtons(queueLocation, directoryQueue);

    setError("go up");
  }

  function onFile(e: React.FocusEvent<HTMLInputElement>) {
    setEnteredFile(e.currentTarget.value);
  }

  function onDirectory(e: React.FocusEvent<HTMLInputElement>) {
    setEnteredDirectory(e.currentTarget.value);
  }

  function onItemClick(clickItem: string, type: string) {
    if (type == "file") {
      setEnteredFile(clickItem);
    } else {
      setEnteredDirectory(clickItem);
      setEnteredFile("");
    }
  }

  return (
    <div
      className="filedialog" /* style={{border:'thin solid black', borderRadius: '20px'}} */
    >
      <div className="header">
        <div className="titlerow">
          <div className="icon">
            <img
              src={CMG2}
              alt="CMG2"
              style={{ width: 35, height: 35, margin: "0", padding: "0" }}
            />
          </div>
          <div className="title">
            <h3 style={{ textAlign: "start", margin: "0px" }}>{title}</h3>
          </div>
          <div className="exit">
            <button onClick={() => onExit()}>X</button>
          </div>
        </div>
        <div className="directoryrow">
          <div className="navigation">
            <button
              style={{ fontSize: "15px" }}
              disabled={disableBack}
              onClick={() => onBack()}
            >
              <GoArrowLeft />
            </button>
            <button
              style={{ fontSize: "15px" }}
              disabled={disableForward}
              onClick={() => onForward()}
            >
              <GoArrowRight />
            </button>
            <button
              style={{ fontSize: "15px" }}
              disabled={disableUp}
              onClick={() => onUp()}
            >
              <GoArrowUp />
            </button>
          </div>
          <div className="directory">
            <TextInput
              name="entereddirectory"
              width="99%"
              initialValue={enteredDirectory}
              onBlur={onDirectory}
            />
          </div>
        </div>
      </div>
      <div className="body">
        <div className="searchtable">
          <div className="filesystemlist" id="filesystem">
            {filesystemDirectory.map(
              (entry: { mountPoint: string; list: string[] }) => (
                <div key={`drive-${entry.mountPoint}`}>
                  <div
                    onClick={() =>
                      onItemClick(entry.mountPoint, "directory")
                    }
                  >
                    {entry.mountPoint}
                  </div>
                  {entry.list.map((item: string) => (
                    <div key={`drive-${entry.mountPoint}-${item}`}>
                      <div
                        className="directoryentry"
                        onClick={() =>
                          onItemClick(
                            `${entry.mountPoint}\\${item}`,
                            "directory"
                          )
                        }
                      >
                        {`${entry.mountPoint}\\${item}`}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
          <div className="directorylist" id="directorylist">
            {directoryList.map((entry: DirectoryEntry) => {
              const isFile: boolean = entry.type == ENTRYTYPE.File;
              return (
                <div
                  className="directoryentry"
                  style={{ color: isFile ? "firebrick" : "black" }}
                  key={`${entry.path}${entry.name}`}
                  onClick={() =>
                    onItemClick(
                      `${entry.path}\\${entry.name}`,
                      isFile ? "file" : "directory"
                    )
                  }
                >
                  {`${entry.name}`}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="footer">
        <div className="filerow">
          <div className="filename">
            <label htmlFor="selectedfile">FileName:&nbsp;</label>
            <TextInput
              width={"92%"}
              onBlur={onFile}
              name="enteredfile"
              initialValue={enteredFile}
            />
          </div>
          <div className="filetypes">
            <label htmlFor="filetypes">Types:&nbsp;</label>
            <input
              name="filetypes"
              id="filetypes"
              value={fileTypes ? fileTypes.join(", ") : ""}
              disabled={true}
            ></input>
          </div>
        </div>
        <div className="status">
          <div className="message">{error}</div>
          <div className="buttons">
            <button onClick={() => onAction()}>{action}</button>
            <button onClick={() => onExit()}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  function TextInput({
    name,
    initialValue,
    width,
    onBlur,
  }: {
    name: string;
    initialValue?: string;
    width: string;
    onBlur: Function;
  }): JSX.Element {
    return (
      <input
        type="text"
        onBlur={(e) => onBlur(e)}
        style={{ width: width }}
        name={name}
        defaultValue={initialValue}
      />
    );
  }
}
