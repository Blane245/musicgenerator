import TimeLine from "classes/timeline";
import GeneratorDialog from "dialogs/generator/generatordialog";
import Body from "layouts/body";
import Footer from "layouts/footer";
import Header from "layouts/header";
import { readCMGFile } from "menus/filehandlers";
import Play from "playfunctions/play";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  DEFAULTLOCALSFURI,
  DEFAULTRECORDFORMAT,
  PLAYMODE,
  RECENTCMGDIRECTORY,
  RECENTFILES,
  RECENTRECORDDIRECTORY,
  RECORDFORMAT,
  SFFILELOCATION,
} from "types";
import { getDirectoryList } from "utils/getdirectorylist";
import loadEnsembleList from "utils/loadEnsembleList";
import { useCMGContext } from "../cmgcontext";
export default function Home() {
  const {
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
    setRecentCMGDirectory,
    setRecentRecordDirectory,
    editGeneratorData,
    generatorDialogVisible,
    mode,
    setMode,
    sourceData,
    setStatus,
  } = useCMGContext();

  // set up the the layout and handle screen size changes
  // for height:
  // the page header is set to 160px to accommodate the
  // title, menu, controls, and timeline display
  // the page footer is set to 170px to accommodate
  // the status area and compressor, equalizer and volume controls
  // the page body is set the the remainder of the screen hight
  // for width:
  // all elements are set screen width (css is 100%)
  // when a window.resize event occurs, the screenHeight and screenWidth
  // context attributes are set, affording components to make necessary
  // adjusts to sizes

  // const movement = useRef<MouseLocation>({ X: 0, Y: 0, dX: 0, dY: 0 });

  useEffect(() => {
    setAppName("CMG");
    setAppVersion(import.meta.env.VERSION);
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
      setBodyHeight(displayHeight - headerHeight - timelineHeight - footerHeight);
      setFooterHeight(footerHeight);
      setVerticalScrollWidth(
        screenWidth - document.documentElement.clientWidth,
      );
      setTimeLine(null);
    };
    handleResize();
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
  // also start with a given file name if provided in the initial parameters
  useEffect(() => {
    setStatus(`${SFFileList.length} Soundfont files loaded.`);

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
          // TODO set recent
        } else {
          setTimeLine(new TimeLine(timelineWidth, timelineHeight));
          setTimeInterval({ startOffset: 0, endOffset: 0 });
          setStatus(`Error reading file '${name}' loaded`);
        }
      } catch (e) {
        setStatus(
          `Error reading cmg file, ${name}. Either it was not foun dor it is in the wrong format`,
        );
      }
    }
    if (initialParams?.file) readFile(initialParams.file);
  }, [SFFileList, initialParams?.file, timelineHeight, timelineWidth]);

  // the home page has two windows. One is for editing a composition
  // the other is for playing a composition.
  // Since play can be invoked from a generator edit dialog,
  // that dialog will be redisplayed after play is complete.
  return (
    <>
      <Helmet>
        <title> {appName} </title>
      </Helmet>
      {!!(mode != PLAYMODE.play && mode != PLAYMODE.solo) && (
        <div className="page" id="page">
          <Header fileName={fileContents ? fileContents.name : ""} />
          <Body />
          <Footer />
        </div>
      )}
        {!!(sourceData && mode != PLAYMODE.idle)&&<Play 
        setMode={setMode} 
        />}
      {mode == PLAYMODE.idle &&
      generatorDialogVisible &&
      editGeneratorData.track &&
      editGeneratorData.type ? (
        <GeneratorDialog
          track={editGeneratorData.track}
          generatorType={editGeneratorData.type}
          generator={editGeneratorData.generator}
          newGenerator={editGeneratorData.newGenerator}
        />
      ) : null}
    </>
  );
}
