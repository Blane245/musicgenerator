// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
import CMGFile from "classes/cmgfile";
import TimeLine from "classes/timeline";
import { useCMGContext } from "cmgcontext";
import FileDialog from "dialogs/filedialog";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { RECENTCMGDIRECTORY, RECENTFILES } from "types";
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
    fileName,
    setFileName,
    recentCMGDirectory,
    setRecentCMGDirectory,
    timeLine,
    setTimeLine,
    setTimeInterval,
  } = useCMGContext();
  const [open, setOpen] = useState<string>("");
  const [dialogType, setDialogType] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [fileExists, setFileExists] = useState<boolean>(false);
  const [mode, setMode] = useState<string>("");

  // initialize the recent file list display to none
  useEffect(() => {
    showRecentList(false);
  }, []);

  // when the file dialog provides a file name, either open the
  // file or perform saveas
  useEffect(() => {
    async function getFileContents() {
      const success = await readFileContents(fileName);
      if (success) setTimeInterval({ startOffset: 0, endOffset: 0 });
    }
    if (fileName == "") return;
    if (dialogType == "Open") {
      getFileContents();
    } else if (dialogType == "Save") {
      // attempt to save as without overwrite
      saveFileContents(fileName, false);
    }
    setDialogType("");
  }, [fileName]);

  // a couple of hot keys are supported for file saving and opening
  useHotkeys(
    "ctrl+s",
    () => {
      if (!playing.current && fileName != "") saveFileContents(fileName, true);
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
      setStatus("New file started.");
      setOpen("");
      setFileExists(false);
      setTimeInterval({ startOffset: 0, endOffset: 0 });
      setTimeLine(new TimeLine(timelineWidth, timelineHeight));
    }
  }

  function handleCancel() {
    setOpen("");
    setDialogType("");
    setFileExists(false);
  }

  async function handleOK() {
    if (open == "new") {
      const contents = new CMGFile();
      newFile(contents, setFileContents);
      setFileName("");
      setStatus("New file started.");
      setOpen("");
      setFileExists(false);
      setTimeInterval({ startOffset: 0, endOffset: 0 });
      setTimeLine(new TimeLine(timelineWidth, timelineHeight));
    } else if (open == "open") {
      setOpen("");
      if (await readFileContents(fileName)) {;
        setFileExists(false);
        setTimeInterval({ startOffset: 0, endOffset: 0 });
      }
    }
  }

  // handle request to open an unnamed or named file.
  // if the current one is 'dirty' the user is asked to confirm over-write
  async function handleOpen(name: string) {
    if (fileContents.dirty) setOpen("open");
    else {
      setOpen("");
      if (name == "") {
        // this is open of an unnamed file - use FileDialog
        setTitle("Select the CMG File to open");
        setDialogType("Open");
        setMode("dialog");
      } else {
        if (! await readFileContents(name)) return;
        setFileContents((prev) => {
          const nameParts = name.split("\\");
          prev.name = nameParts[nameParts.length - 1];
          return prev;
        });
        addRecent(name);
        window.localStorage.setItem(RECENTCMGDIRECTORY, recentCMGDirectory);
        setTimeInterval({ startOffset: 0, endOffset: 0 });
      }
    }
  }

  // handle request to open a file.
  // if the current one is 'dirty' the user is asked to confirm over-write
  function handleFileSaveAs() {
    setOpen("");
    showRecentList(false);
    setTitle("Enter File Name to Save File");
    setDialogType("Save");
    setMode("dialog");
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
    setFileName(name);
  }

  function handleOverWriteOK(): void {
    setFileExists(false);
    saveFileContents(fileName, true);
  }

  async function saveFileContents(name: string, overWrite: boolean) {
    const page: HTMLElement | null = document.getElementById("page");
    // save the xml data
    try {
      const error: string | undefined = await writeCMGFile(
        fileName,
        overWrite,
        fileContents,
        timeLine,
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

  async function readFileContents(name: string): Promise<boolean> {
    let success: boolean = false;
    const page = document.getElementById("page");
    document.body.style.cursor = "wait";
    try {
      if (page) page.inert = true;
      if (timeLine) {
        const { fileContents, timeLine: thisTimeLine } = await readCMGFile(
          name,
          timeLine.width,
          timeLine.height,
        );
        if (fileContents) {
          setFileContents(fileContents);
          setStatus(`File '${name}' loaded`);
          if (page) page.inert = false;
          // add file to recentFiles list
          addRecent(name);
          setFileName(name);
          setTimeLine(thisTimeLine);
        }
        success = true;
      } else {
        setStatus(
          "Error reading cmg file. Time Line has not yet been defined."
        );
      }
    } catch (err) {
      const e = err as Error;
      setStatus(
        `Error reading cmg file, type: '${e.name}' message: '${e.message}'`
      );
    }
    if (page) page.inert = false;
    document.body.style.cursor = "default";
    return success;
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
      {mode != "" ? (
        <FileDialog
          title={title}
          action={dialogType}
          fileTypes={["cmg"]}
          directory={recentCMGDirectory}
          setDirectory={setRecentCMGDirectory}
          setFile={setFileName}
          setMode={setMode}
          setStatus={setStatus}
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
}
