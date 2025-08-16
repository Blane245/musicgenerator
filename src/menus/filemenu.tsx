// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
import CMGFile from "classes/cmgfile";
import { useCMGContext } from "cmgcontext";
import FileDialog from "dialogs/filedialog";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { RECENTCMGDIRECTORY, RECENTFILES } from "types";
import { newFile, setDirty } from "utils/cmfiletransactions";
import { readCMGFile, writeCMGFile } from "./filehandlers";

export default function FileMenu() {
  const {
    fileContents,
    setFileContents,
    setStatus,
    playing,
    recentFiles,
    setRecentFiles,
    fileName,
    setFileName,
    recentCMGDirectory,
    setRecentCMGDirectory,
  } = useCMGContext();
  const [open, setOpen] = useState<string>("");
  const [dialogType, setDialogType] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [newAllowed, setNewAllowed] = useState<boolean>(false);
  const [fileExists, setFileExists] = useState<boolean>(false);

  // initialize the recent file list display to none
  useEffect(() => {
    showRecentList(false);
  }, []);
  // when the file dialog provides a file name, either open the
  // file or perform saveas
  useEffect(() => {
    if (dialogType == "open" && fileName != "") {
      readFileContents(fileName);
    }
    else if (dialogType == "saveas" && fileName != "") {
      // attempt to save as without overwrite
      saveFileContents(fileName, false);
    }
    setDialogType("");
  }, [fileName]);

  // a couple of hot keys are supported for faile saving and opening
  useHotkeys(
    "ctrl+s",
    () => {
      if (!playing.current)
        saveFileContents(fileName, true);
    },
    { preventDefault: true }
  );

  useHotkeys(
    "ctrl+o",
    () => {
      if (!playing.current) handleOpen("");
    },
    { preventDefault: true }
  );

  // handle request to create a new file
  // If the curretn one is 'dirty' the user is
  // prompted to confirm overwrite
  function handleFileNew() {
    if (fileContents.dirty) setOpen("new");
    else {
      const contents: CMGFile = new CMGFile();
      newFile(contents, setFileContents);
      setFileName("");
      setStatus("New file started");
      setOpen("");
      setFileExists(false);
    }
  }

  function handleCancel() {
    setOpen("");
    setDialogType("");
    setFileExists(false);
  }

  function handleOK() {
    if (open == "new") {
      const contents = new CMGFile();
      newFile(contents, setFileContents);
      setOpen("");
      setFileName("");
      setStatus("New file started");
    } else if (open == "open") {
      setOpen("");
      readFileContents(fileName);
    }
  }

  // handle request to open an unnamed or named file.
  // if the current one is 'dirty' the user is asked to confirm over-write
  function handleOpen(name: string) {
    if (fileContents.dirty) setOpen("open");
    else {
      setOpen("");
      if (name == "") {
        // this is open of an unnamed file - use FileDialog
        setTitle("Select the CMG File to open");
        setNewAllowed(false);
        setDialogType("open");
      } else {
        document.body.style.cursor = 'wait';
        readFileContents(name);
        setFileContents((prev) => {
          const nameParts = name.split('/');
          prev.name = nameParts[nameParts.length-1];
          return prev;
        });
        window.localStorage.setItem(RECENTCMGDIRECTORY, recentCMGDirectory);
        document.body.style.cursor = 'normal';
      }
    }
  }

  // handle request to open a file.
  // if the current one is 'dirty' the user is asked to confirm over-write
  function handleFileSaveAs() {
    setOpen("");
    showRecentList(false);
    setTitle("Enter File Name to Save File");
    setNewAllowed(true);
    setDialogType("saveas");
  }

  function handleFileSave() {
    saveFileContents(fileName, true);
    showRecentList(false);
  }

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
        handleFileSave();
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
  }

  function handleOverWriteOK(): void {
    setFileExists(false);
    saveFileContents(fileName, true);
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
              Open File...
            </div>
            <div className="dItem" onClick={() => handleMenuSelect("save")}>
              Save File
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
                    onClick={(e) => handleRecentSelect(e,f)}
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {dialogType != "" ? (
        <FileDialog
          title={title}
          newAllowed={newAllowed}
          types={["cmg"]}
          directory={recentCMGDirectory}
          setDirectory={setRecentCMGDirectory}
          setFileName={setFileName}
          setType={setDialogType}
        />
      ) : null}
      {open != "" ? (
        <div
          style={{ display: open == "" ? "none" : "block" }}
          className="modal-content"
        >
          <div className="modal-header">
            <span className="close">&times;</span>
            {open == "new" || open == "open" ? (
              <h2>Confirm {open} file</h2>
            ) : null}
            {open == "exit" ? <h2>Confirm exit</h2> : null}
          </div>
          <div className="modal-body">
            <p>
              The current file has not been saved. Do you wish to delete its
              contents without saving?
            </p>
          </div>
          <div className="modal-footer">
            <button id={"file-delete:" + fileContents.name} onClick={handleOK}>
              OK
            </button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : null}
      {fileExists ? (
        <div className="modal-content">
          <div className="modal-header">
            <span className="close">&times;</span>
            <h2>Confirm file overwrite</h2>
          </div>
          <div className="modal-body">
            <p>
              {`File ${fileName} already exists. Do you wish to overwrite it`}
            </p>
          </div>
          <div className="modal-footer">
            <button
              id={"file-overwrite:" + fileName}
              onClick={handleOverWriteOK}
            >
              OK
            </button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : null}
    </>
  );

  async function saveFileContents(
    name: string,
    overWrite: boolean
  ) {
    const page: HTMLElement | null = document.getElementById("page");
    // save the xml data
    try {
      const error: string | undefined = await writeCMGFile(
        fileName,
        overWrite,
        fileContents
      );
      if (error == "file exists but overwrite is false") {
        setFileExists(true);
      } else if (error == "") {
        setDirty(false, fileContents, setFileContents);
        setStatus(`File '${name}' saved.`);
        addRecent(name);
        setDialogType("");
        setOpen("");
      } else if (error != undefined) setStatus(error);
      if (page) page.inert = false;
    } catch (err) {
      if (page) page.inert = false;
      const e = err as Error;
      setStatus(
        `Error saving cmg file '${name}': '${e.name}' message: '${e.message}'`
      );
    }
  }
  async function readFileContents(name: string) {
    const page = document.getElementById("page");

    try {
      if (page) page.inert = true;
      const fileContents: CMGFile | null = await readCMGFile(name);
      if (fileContents) {
        setFileContents(fileContents);
        setStatus(`File '${name}' loaded`);
        if (page) page.inert = false;
        // add file to recentFiles list
        addRecent(fileName);
        setFileName(name);
      }
    } catch (err) {
      const e = err as Error;
      setStatus(
        `Error reading cmg file, type: '${e.name}' message: '${e.message}'`
      );
      if (page) page.inert = false;
    }
  }

  // add file to recent files list. if it is already there, move to the top
  function addRecent(fileName: string) {
    let theList: string[] = [...recentFiles];
    theList = theList.filter((f) => f != fileName).filter((f) => f!="");
    theList.unshift(fileName);
    // trim the list to 10 names
    theList = theList.filter((_f, i) => i < 10);
    setRecentFiles(theList);
    window.localStorage.setItem(RECENTFILES, theList.join("|"));
  }
}
