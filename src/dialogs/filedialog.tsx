import { useCMGContext } from "cmgcontext";
import { useEffect, useState } from "react";
import { RECENTCMGDIRECTORY } from "types";
import { getDirectoryList } from "utils/getdirectorylist";

type FileDialogProps = {
  title: string;
  newAllowed: boolean;
  types: string[];
  directory: string;
  setDirectory: Function;
  setFileName: Function;
  setType: Function;
};

// a dialog for the use to select a file from a list, or enter a new one
export default function FileDialog(props: FileDialogProps): JSX.Element {
  const {
    title,
    newAllowed,
    types,
    directory,
    setDirectory,
    setFileName,
    setType,
  } = props;
  const { setStatus } = useCMGContext();
  const [fileList, setFileList] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [currentDirectory, setCurrentDirectory] = useState<string>(directory);
  const [errors, setErrors] = useState<string[]>([]);

  // initialze filename to blank
  useEffect(()=> {
    setFileName('');
  },[])
  // load the file list whenever the current directory changes
  useEffect(() => {
    try {
      getDirectoryList(currentDirectory, types, setFileList, setStatus);
    } catch (error) {
      setErrors([error as string]);
      setFileList([]);
    }
  }, [currentDirectory]);

  // when the filelist changes set the selectedfile to the
  // first one in the list
  useEffect(() => {
    if (fileList.length > 0) setSelectedFile(fileList[0]);
  }, [fileList]);

  // when the directory name is updated and focus leaves the field, update the current
  // directory
  function onLeaveDirectoryName(e: React.FocusEvent<HTMLInputElement>) {
    setCurrentDirectory(e.currentTarget.value);
  }

  // when the OK button is clicked and the use has selected a file, set the
  // fileName and exit
  function onOKClick() {
    const d:string = currentDirectory.replace(/\\/g, '/');
    setDirectory(d);
    setFileName(d + '/' + selectedFile);
    window.localStorage.setItem(RECENTCMGDIRECTORY, d);
  }

  // when Exit is selected, set the filename to blank and exit
  function onExitClick() {
    setFileName("");
    setType("");
  }

  return (
    <div
      className="modal-content"
      style={{ display: "block", top: 100, left: 100 }}
    >
      <div className="modal-header">
        <h2>{title}</h2>
      </div>
      <div className="modal-body">
        <label>
          Directory:&nbsp;
          <input type="text" onBlur={(e) => onLeaveDirectoryName(e)} defaultValue={directory} />
        </label>
        <br />
        <label>
          File List:&nbsp;
          <select
            multiple={false}
            name={"fileList"}
            value={selectedFile}
            onChange={(e) =>
              setSelectedFile(fileList[e.currentTarget.selectedIndex])
            }
          >
            {fileList.map((f, i) => (
              <option key={`file-${i}`} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <br/>
        {newAllowed ? (
          <label >
            File Name:&nbsp;
            <input type="text" onChange={(e)=> setSelectedFile(e.currentTarget.value+'.cmg')}/>
          </label>
        ) : null}
      </div>
      <div className="modal-footer">
        <button name="OK" onClick={() => onOKClick()}>
          OK
        </button>
        <button name="Exit" onClick={() => onExitClick()}>
          Exit
        </button>
        {errors.map((e, i) => (
          <h4 color="red" key={`error-${i}`}>
            {e}
          </h4>
        ))}
      </div>
    </div>
  );
}
