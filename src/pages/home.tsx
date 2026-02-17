import TimeLine from "classes/timeline";
import GeneratorDialog from "dialogs/generator/generatordialog";
import Body from "layouts/body";
import Footer from "layouts/footer";
import Header from "layouts/header";
import { readCMGFile } from "menus/filehandlers";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  DEFAULTLOCALSFURI,
  DEFAULTRECORDFORMAT,
  RECENTCMGDIRECTORY,
  RECENTFILES,
  RECENTRECORDDIRECTORY,
  RECORDFORMAT,
  SFFILELOCATION,
} from "types";
import { getDirectoryList } from "utils/getdirectorylist";
import loadEnsembleList from "utils/loadEnsembleList";
import { useCMGContext } from "../cmgcontext";
import Play from "playfunctions/play";
export default function Home() {
  const {
    cursor,
    initialParams,
    appName,
    fileContents,
    setFileContents,
    setAppName,
    setAppVersion,
    setScreenHeight,
    setScreenWidth,
    setDisplayHeight,
    setDisplayWidth,
    setHeaderHeight,
    setBodyHeight,
    timelineHeight,
    timelineWidth,
    setTimelineHeight,
    setTimelineWidth,
    setTimeLine,
    setTimeInterval,
    setControlWidth,
    setFooterHeight,
    setVerticalScrollWidth,
    setSFLocalDirectory,
    setSFFileList,
    SFFileList,
    setEnsembleList,
    setRecordFormat,
    setRecentFiles,
    recentFiles,
    setRecentCMGDirectory,
    setRecentRecordDirectory,
    editGeneratorData,
    generatorDialogVisible,
    playData,
    setStatus,
  } = useCMGContext();

  useEffect(()=> {
    document.body.style.cursor = cursor;
  }, [cursor])
  useEffect(() => {
    setAppName("CMG");
    setAppVersion(import.meta.env.VERSION);
    // set up the the layout and handle screen size changes
    const handleResize = () => {
      const root: HTMLElement | null = document.getElementById("root");
      if (!root) return;
      const screenHeight: number = window.innerHeight;
      const screenWidth: number = window.innerWidth;
      const displayHeight: number = screenHeight;
      const displayWidth: number = screenWidth;
      const headerHeight: number = 40;
      const timelineHeight: number = 45;
      const controlWidth: number = 200;
      const timelineWidth: number = displayWidth - controlWidth;
      const footerHeight: number = 180;
      setScreenHeight(screenHeight);
      setScreenWidth(screenWidth);
      setDisplayHeight(displayHeight);
      setDisplayWidth(displayWidth);
      setHeaderHeight(headerHeight);
      setTimelineHeight(timelineHeight);
      setTimelineWidth(timelineWidth);
      setControlWidth(controlWidth);
      setBodyHeight(
        displayHeight - headerHeight - timelineHeight - footerHeight,
      );
      setFooterHeight(footerHeight);
      setVerticalScrollWidth(
        screenWidth - document.documentElement.clientWidth,
      );
      setTimeLine(null);
    };
    handleResize();

    // add an event handler for window resizing
    window.addEventListener("resize", handleResize);

    // load the ensemble list at startup
    loadEnsembleList(setEnsembleList);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // get the soundfont file location from local storage at startup
  useEffect(() => {
    let SFFileLocation: string | null =
      window.localStorage.getItem(SFFILELOCATION);
    if (!SFFileLocation) {
      window.localStorage.setItem(SFFILELOCATION, DEFAULTLOCALSFURI);
      SFFileLocation = DEFAULTLOCALSFURI;
      setSFLocalDirectory(SFFileLocation);
    } else setSFLocalDirectory(SFFileLocation);

    // load the soundfont file list
    try {
      getDirectoryList(
        SFFileLocation,
        ["sf2", "SF2"],
        setSFFileList,
        setStatus,
      );
    } catch (error) {
      setStatus(error as string);
    }

    // get the record format from local storage
    const recordFormat: string | null =
      window.localStorage.getItem(RECORDFORMAT);
    if (!recordFormat) {
      window.localStorage.setItem(RECORDFORMAT, DEFAULTRECORDFORMAT);
      setRecordFormat(DEFAULTRECORDFORMAT);
    } else setRecordFormat(recordFormat);

    // get the recent file list from local storage
    const recentFiles: string | null = window.localStorage.getItem(RECENTFILES);
    if (!recentFiles) {
      setRecentFiles([]);
    } else {
      const recentFileArray: string[] = recentFiles
        .split("|")
        .filter((f) => f != "");
      if (recentFileArray[0] != "") setRecentFiles(recentFileArray);
    }

    // get the most recent file list directory from local storage
    const recentCMGDirectory: string | null =
      window.localStorage.getItem(RECENTCMGDIRECTORY);
    if (!recentCMGDirectory) {
      setRecentCMGDirectory("");
    } else {
      setRecentCMGDirectory(recentCMGDirectory);
    }

    // get the most recent record directory from local storage
    const recentRecordDirectory: string | null = window.localStorage.getItem(
      RECENTRECORDDIRECTORY,
    );
    if (!recentRecordDirectory) {
      setRecentRecordDirectory("spectrum");
    } else {
      setRecentRecordDirectory(recentRecordDirectory);
    }
  }, []);

  // notify the user that the SF file list has been loaded
  useEffect(() => {
    setStatus(`${SFFileList.length} Soundfont files loaded.`);
  }, [SFFileList]);

  // handle a startup when a file name has been provided in the parameters
  useEffect(() => {
    if (initialParams.file == "" || timelineHeight == 0 || timelineWidth == 0)
      return;
    async function readFile(name: string) {
      try {
        // copy of readfilecontents from filemenu
        const { fileContents, timeLine } = await readCMGFile(
          name,
          timelineWidth,
          timelineHeight,
        );
        if (fileContents) {
          setFileContents(fileContents);
          setStatus(`File '${name}' loaded`);
          setTimeLine(timeLine);
          setTimeInterval({ startOffset: 0, endOffset: 0 });
          addRecent(name);
        } else {
          setTimeLine(new TimeLine(timelineWidth, timelineHeight));
          setTimeInterval({ startOffset: 0, endOffset: 0 });
          setStatus(`Error reading file '${name}' loaded`);
        }
      } catch (e) {
        setStatus(
          `Error reading cmg file, ${name} at startup. Either it was not found or it is in the wrong format`,
        );
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
    }
    readFile(initialParams.file);
  }, [initialParams.file, timelineHeight, timelineWidth]);

  // the home page has two windows. One is for editing a composition
  // the other is for playing a composition.
  // Since play can be invoked from a generator edit dialog,
  // that dialog will be redisplayed after play is complete.
  return (
    <>
      <Helmet>
        <title> {appName} </title>
      </Helmet>
      <div className="page" id="page" style={{ cursor: cursor }}>
        <Header fileName={fileContents ? fileContents.name : ""} />
        <Body />
        <Footer />
      </div>
      {playData && (
        <div className="page" id="page" style={{ cursor: cursor }}>
          <Play playData={playData} />
        </div>
      )}
      {generatorDialogVisible &&
        editGeneratorData.track &&
        editGeneratorData.type && (
          <GeneratorDialog
            track={editGeneratorData.track}
            generatorType={editGeneratorData.type}
            generator={editGeneratorData.generator}
            newGenerator={editGeneratorData.newGenerator}
          />
        )}
    </>
  );
}
