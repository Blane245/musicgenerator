// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
// use cases
// Start an new file
//    if the current file is not dirty, clear the fileContents and timeinterval and exit
//    if the current file is dirty, request confirmation to delete
//      if delete OK, clear fileContents and timeinterval and exit
// Open a file
//    if current file is not dirty, have filedialog open the file
//      if filedialog returns a filename read the file. update recent. Handle read errors
//    if current file is dirty, request confirmation to delete
//      if delete OK, read the file. handle read errors
// save file (name is filecontents.name)
//    save the named file. handle save errors.
// save as file (not named)
//    have filedialog request a file to save to.
//    if the file does not exist, save the file contents to the named file. handle save errors
//    if the file exists, request confirmation to overwrite the file
//      if overwrite OK, save the file contents to the named file. handle save errors.
// open recent file
//    if the current file is dirty, request confirmation to delete
//      if delete OK, read the file. update recent. Handle read errors.

// routines
//  menu actions (new, open, save, save as, recent)
//  readfile
//  savefile
//  saveasfile
//  update recent list
//  confim delete
//  confirm overwrite
// states
//  filename - blank unless named by open or recent, used by readfile, savefile, saveasfile
//  confirmDelete - boolean, set when filecontents is dirty, clear when user confirms deletion
//  overwrite - bool, set when filedialog says file exits
//  dialogmode - blank, Open or Save for filedialog
import CMGFile from "classes/cmgfile";
import TimeLine from "classes/timeline";
import { useCMGContext } from "cmgcontext";
import FileDialog from "dialogs/filedialog";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { RECENTFILES } from "types";
import { newFile, setDirty } from "utils/cmfiletransactions";
import { readCMGFile, writeCMGFile } from "./filehandlers";

export default function FileMenu() {
  const {
    timelineWidth,
    timelineHeight,
    fileContents,
    setFileContents,
    setStatus,
    playing,
    recentFiles,
    setRecentFiles,
    recentCMGDirectory,
    setRecentCMGDirectory,
    timeLine,
    setTimeLine,
    setTimeInterval,
  } = useCMGContext();
  const [fileName, setFileName] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<string>("");

  // initialize the recent file list display to none
  // useEffect(() => {
  //   showRecentList(false);
  // }, []);

  // when the file dialog and provides a file name or a recent file is selected, either open the
  // file or perform saveas
  // useEffect(() => {
  //   async function getFileContents() {
  //     await readFileContents(fileName);
  //   }
  //   if (fileName == "" && dialogType == "") return;
  //   if (fileName != "" && dialogType == "") {
  //     // a recent file to open
  //     readFileContents(fileName);
  //     return;
  //   }
  //   if (fileName != "" && dialogType == "Open") {
  //     // file dialog  provided a filename to open
  //     readFileContents(fileName);
  //     return;
  //   }
  //   if (fileName != "" && dialogType == "Save") {
  //     // file dialog provided a filename to save
  //     saveFileContents(fileName, false);
  //     return;
  //   }
  //   showRecentList(false);
  // }, [fileName, dialogType]);

  // a couple of hot keys are supported for file saving and opening
  useHotkeys(
    "ctrl+s",
    () => {
      if (fileName != "") saveFileContents(fileName, true);
    },
    { preventDefault: true },
  );

  useHotkeys(
    "ctrl+o",
    () => {
      handleOpen("");
    },
    { preventDefault: true },
  );

  function handleMenuSelect(action: string) {
    if (playing.current) return;
    switch (action) {
      case "new":
        handleFileNew();
        break;
      case "open":
        handleOpen("");
        break;
      case "save":
        handleFileSave(fileContents.name);
        break;
      case "saveas":
        handleFileSaveAs();
        break;
      case "recent":
        // enable load recents and display
        handleFileRecentList();
        break;
      default:
        break;
    }
  }
  function handleCancel() {
    setConfirmDelete(false);
    setConfirmOverwrite(false);
    setDialogMode("");
    showRecentList(false);
  }

  // used by new, open, recent
  async function handleDeleteOK() {
    if (fileName != "") {
      readFileContents(fileName);
      addRecent(fileName);
      setFileName("");
      setConfirmDelete(false);
      setConfirmOverwrite(false);
      setDialogMode("");
      return;
    }
    if (dialogMode == "None") {
      const contents = new CMGFile();
      newFile(contents, setFileContents);
      setTimeInterval({ startOffset: 0, endOffset: 0 });
      setTimeLine(new TimeLine(timelineWidth, timelineHeight));
      setFileName("");
      setConfirmDelete(false);
      setConfirmOverwrite(false);
      setDialogMode("");
      setStatus("New file started.");
      return;
    } else {
      setDialogMode("Open");
      setConfirmDelete(false);
      setConfirmOverwrite(false);
    }

    // if the file name is blank and the dialogmode is not blank
    // use the filedialog to get the file name
  }

  function handleFileNew() {
    if (fileContents.dirty) {
      setFileName("");
      setConfirmDelete(true);
      setDialogMode("None");
    } else {
      createNewFile();
    }
  }

  function createNewFile() {
    const contents: CMGFile = new CMGFile();
    newFile(contents, setFileContents);
    setTimeLine(new TimeLine(timelineWidth, timelineHeight));
    setTimeInterval({ startOffset: 0, endOffset: 0 });
    setFileName("");
    setConfirmDelete(false);
    setDialogMode("");
    showRecentList(false);
    setStatus("New file started.");
  }

  // handle request to open an unnamed or named file.
  // if the current one is 'dirty' the user is asked to confirm over-write
  async function handleOpen(name: string) {
    if (fileContents.dirty) {
      setConfirmDelete(true);
      setFileName(name);
    } else {
      if (name == "") {
        // this is open of an unnamed file - use FileDialog
        setDialogMode("Open");
      } else {
        setFileName(name);
        readFileContents(name);
        addRecent(name);
        setFileName("");
        setConfirmDelete(false);
        setConfirmOverwrite(false);
        showRecentList(false);
      }
    }
  }

  function handleFileSave(name: string) {
    saveFileContents(name, true);
    addRecent(name);
    setFileName("");
    setConfirmDelete(false);
    setConfirmOverwrite(false);
    setDialogMode("");
    showRecentList(false);
  }

  // handle request to open a file.
  // if the current one is 'dirty' the user is asked to confirm over-write
  function handleFileSaveAs() {
    setDialogMode("Save");
    setFileName("");
    setConfirmDelete(false);
    setConfirmOverwrite(false);
    showRecentList(false);
  }

  function showRecentList(ok: boolean) {
    const recentList: HTMLElement | null = document.getElementById("recent");
    if (!recentList) return;
    recentList.style.display = ok ? "block" : "none";
  }

  function handleFileRecentList() {
    showRecentList(true);
  }
  function handleRecentSelect(e: React.MouseEvent, name: string) {
    e.stopPropagation();
    e.preventDefault();
    handleOpen(name);
    showRecentList(false);
    setDialogMode("");
  }

  function handleOverWriteOK(): void {
    saveFileContents(fileName, true);
    addRecent(fileName);
    setFileName("");
    setConfirmDelete(false);
    setConfirmOverwrite(false);
    setDialogMode("");
    showRecentList(false);
  }

  async function saveFileContents(name: string, overWrite: boolean) {
    // save the xml data
    try {
      document.body.style.cursor = "wait";
      const error: string | undefined = await writeCMGFile(
        name,
        overWrite,
        fileContents,
        timeLine,
      );

      if (error == "file exists but overwrite is false") {
        setConfirmOverwrite(true);
      } else if (error == "") {
        fileContents.name = name;
        setDirty(false, fileContents, setFileContents);
        setStatus(`File '${name}' saved.`);
      } else if (error != undefined) setStatus(error);
      document.body.style.cursor = "default";
    } catch (err) {
      const e = err as Error;
      setStatus(
        `Error saving cmg file '${name}': '${e.name}' message: '${e.message}'`,
      );
      document.body.style.cursor = "default";
    }
  }

  async function readFileContents(name: string) {
    document.body.style.cursor = "wait";
    try {
      const { fileContents, timeLine: thisTimeLine } = await readCMGFile(
        name,
        timelineWidth,
        timelineHeight,
      );
      if (fileContents) {
        setFileContents(fileContents);
        setStatus(`File '${name}' loaded`);
        // add file to recentFiles list
        setTimeLine(thisTimeLine);
        setTimeInterval({ startOffset: 0, endOffset: 0 });
      } else {
        setTimeLine(new TimeLine(timelineWidth, timelineHeight));
        setTimeInterval({ startOffset: 0, endOffset: 0 });
        setStatus("Error reading cmg file");
      }
      document.body.style.cursor = "default";
    } catch (err) {
      const e = err as Error;
      setStatus(
        `Error reading cmg file, type: '${e.name}' message: '${e.message}'`,
      );
      document.body.style.cursor = "default";
    }
  }

  // add file to recent files list. if it is already there, move to the top
  function addRecent(fileName: string) {
    let theList: string[] = [...recentFiles];
    theList = theList.filter((f) => f != fileName).filter((f) => f != "");
    theList.unshift(fileName);
    // trim the list to 10 names
    theList = theList.filter((_f, i) => i < 10);
    setRecentFiles(theList);
    window.localStorage.setItem(RECENTFILES, theList.join("|"));
  }

  // calld by fileDialog when user has selected a file to open or save
  function processFile(action: string, name: string) {
    if (action == "Open") {
      readFileContents(name);
      addRecent(name);
      setFileName(name);
    } else {
      saveFileContents(name, false);
      addRecent(name);
      setFileName(name);
    }
    setConfirmDelete(false);
    setConfirmOverwrite(false);
    setDialogMode("");
    showRecentList(false);
  }

  return (
    <>
      <div className="navbar">
        <div className="dropdown">
          <div className="dropbtn">
            File
            <i className="fa fa-caret-down"></i>
          </div>
          <div className="dropdown-one">
            <div className="dItem" onClick={() => handleMenuSelect("new")}>
              New File...
            </div>
            <div className="dItem" onClick={() => handleMenuSelect("open")}>
              Open File... (ctrl+o)
            </div>
            <div className="dItem" onClick={() => handleMenuSelect("save")}>
              Save File (ctrl+s)
            </div>
            <div className="dItem" onClick={() => handleMenuSelect("saveas")}>
              Save As...
            </div>
            <div className="dItem" onClick={() => handleMenuSelect("recent")}>
              Open Recent
              <i className="fa fa-caret-down"></i>
              <div
                className="dropdown-two"
                id="recent"
                style={{ display: "none" }}
              >
                {recentFiles.map((f) => (
                  <div
                    className="dItem"
                    key={`rf-${f}`}
                    onClick={(e) => handleRecentSelect(e, f)}
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {!!(dialogMode == "Open" || dialogMode == "Save") && (
        <FileDialog
          action={dialogMode}
          fileTypes={["cmg"]}
          directory={recentCMGDirectory}
          setDirectory={setRecentCMGDirectory}
          setFile={setFileName}
          setMode={setDialogMode}
          setStatus={setStatus}
          reaction={processFile}
        />
      )}
      {!!confirmDelete && (
        <div className="modal-content">
          <div className="modal-header">
            <h2>Confirm file deletion</h2>
          </div>
          <div className="modal-body">
            <h3>
              The current file has not been saved. Do you wish to delete its
              contents without saving?
            </h3>
          </div>
          <div className="modal-footer">
            <button onClick={handleDeleteOK}>OK</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      )}
      {!!confirmOverwrite && (
        <div className="modal-content">
          <div className="modal-header">
            <h2>Confirm file overwrite</h2>
          </div>
          <div className="modal-body">
            <h3>
              {`File ${fileName} already exists. Do you wish to overwrite it`}
            </h3>
          </div>
          <div className="modal-footer">
            <button onClick={handleOverWriteOK}>OK</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
