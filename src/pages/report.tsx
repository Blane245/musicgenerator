import "./home.css";
import CMGFile from "../classes/cmgfile";

export default function Report(fileContents: CMGFile) {

  return (
    <>
    {fileContents? <p>This is the report writer for file {fileContents.name}</p>
    :
    <p>No file to report on</p>}
    </>
  );
}
