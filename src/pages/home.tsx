import GeneratorDialog from "dialogs/generator/generatordialog";
import Body from "layouts/body";
import Footer from "layouts/footer";
import Header from "layouts/header";
import Preview from "playfunctions/previewer/preview";
import { MouseEvent, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import {
  DEFAULTLOCALSFURI,
  DEFAULTRECORDFORMAT,
  MouseLocation,
  PLAYMODE,
  PREVIEWFFTSIZE,
  PREVIEWFREQUENCYDISPLAY,
  RECENTCMGDIRECTORY,
  RECENTFILES,
  RECENTRECORDDIRECTORY,
  RECORDFORMAT,
  SFFILELOCATION,
} from "types";
import { getDirectoryList } from "utils/getdirectorylist";
import setCursor from "utils/setcursor";
import { useCMGContext } from "../cmgcontext";
import "./home.css";
export default function Home() {
  const {
    appName,
    setAppName,
    setAppVersion,
    setScreenHeight,
    setScreenWidth,
    setDisplayHeight,
    setDisplayWidth,
    setHeaderHeight,
    setTimelineHeight,
    setTimelineWidth,
    setTimeLine,
    setControlWidth,
    setPreviewHeight,
    setPreviewWidth,
    setFooterHeight,
    setBodyHeight,
    setVerticalScrollWidth,
    setSFLocalDirectory,
    setSFFileList,
    SFFileList,
    setRecordFormat,
    setRecentFiles,
    setRecentCMGDirectory,
    setRecentRecordDirectory,
    editGeneratorData,
    generatorDialogVisible,
    mouseDown,
    setMouseLocation,
    playing,
    mode,
    setMode,
    sourceData,
    setStatus,
    setFFTSize,
    setFrequencyDisplay,
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

  const movement = useRef<MouseLocation>({ X: 0, Y: 0, dX: 0, dY: 0 });

  useEffect(() => {
    setAppName("Computer Music Generator");
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
      const previewWidth: number = displayWidth;
      const footerHeight: number = 180;
      const previewHeight: number =
        displayHeight - headerHeight - timelineHeight - footerHeight;
      const bodyHeight: number = previewHeight;
      setScreenHeight(screenHeight);
      setScreenWidth(screenWidth);
      setDisplayHeight(displayHeight);
      setDisplayWidth(displayWidth);
      setHeaderHeight(headerHeight);
      setTimelineHeight(timelineHeight);
      setTimelineWidth(timelineWidth);
      setControlWidth(controlWidth);
      setPreviewWidth(previewWidth);
      setBodyHeight(bodyHeight);
      setPreviewHeight(previewHeight);
      setFooterHeight(footerHeight);
      setVerticalScrollWidth(
        screenWidth - document.documentElement.clientWidth
      );
      setTimeLine(null);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  // get the soundfont file location from local storage at startup
  // default to server
  // localstorage items
  // record format - 'recordFormat' (default 'mp3')
  // sf file location - 'SFFileLocation' (default C:/soundfonts)
  // recent files - 'recentfiles'
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
        setStatus
      );
    } catch (error) {
      setStatus(error as string);
    }

    // get the record format from local storage
    let recordFormat: string | null = window.localStorage.getItem(RECORDFORMAT);
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

    // get the most recent recrod directory from local storage
    const recentRecordDirectory: string | null = window.localStorage.getItem(
      RECENTRECORDDIRECTORY
    );
    if (!recentRecordDirectory) {
      setRecentRecordDirectory("spectrum");
    } else {
      setRecentRecordDirectory(recentRecordDirectory);
    }

    // get the frequency display type from local storage
    const previewFrequencyDisplay: string | null = window.localStorage.getItem(
      PREVIEWFREQUENCYDISPLAY
    );

    if (!previewFrequencyDisplay) {
      setFrequencyDisplay("spectrum");
    } else {
      setFrequencyDisplay(previewFrequencyDisplay);
    }

    // get the frequency display type from local storage
    const previewFFTSize: string | null =
      window.localStorage.getItem(PREVIEWFFTSIZE);

    if (!previewFFTSize) {
      setFFTSize(2048);
    } else {
      setFFTSize(parseInt(previewFFTSize));
    }
  }, []);

  // notify the user that the SF file list has been loaded
  useEffect(() => {
    setStatus(`${SFFileList.length} Soundfont files loaded.`);
  }, [SFFileList]);

  // some of the components of this app process mouse movements. The
  // function below capture those movements and pass them along
  // at regular time intervals.
  // If a components needs these services, it should trigger the mouseDown
  // reference property.
  // when the mouse goes down, mouse movements collected and
  // passed to the components needing them at a interval
  // determined by DURATION. This prevents performance
  // problems caused by the frequent interrupts caused by mouse movements

  // mouse movement collection.
  let timer: number | null = null;
  const DURATION = 100;
  let t0: number = Date.now();
  let t1: number = t0;
  function collectMouseMovements() {
    if (mouseDown.current) {
      t1 = Date.now();
      // console.log(
      //   "mouse location update on timeout:",
      //   movement.current,
      //   "deltaT",
      //   t1 - t0
      // );
      t0 = t1;
      const newMovement: MouseLocation = {
        X: movement.current.X,
        Y: movement.current.Y,
        dX: movement.current.dX,
        dY: movement.current.dY,
      };
      setMouseLocation(newMovement);
      movement.current.dX = 0;
      movement.current.dY = 0;
      timer = window.setTimeout(collectMouseMovements, DURATION);
    } else {
      timer && window.clearTimeout(timer);
      timer = null;
    }
  }

  // the mouse goes up, which should stop mouse movement accumulations
  // and mouse processing activities by the components.
  function onMouseUp() {
    if (!mouseDown.current || playing.current) return;
    setCursor("default");
    mouseDown.current = false;
    // console.log("mouse released");
    timer && window.clearTimeout(timer);
    timer = null;
    setMouseLocation(null);
  }

  function onMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (!mouseDown.current || playing.current) return;
    movement.current = {
      X: e.nativeEvent.offsetX,
      Y: e.nativeEvent.offsetY,
      dX: 0,
      dY: 0,
    };
    // console.log("mouse down at", movement.current);
    collectMouseMovements();
    e.stopPropagation();
    e.preventDefault();
  }

  // function to accumulate mouse movements on mouse move event
  // this is triggered by the onMouseMove event for the page
  // only consume the event is the mouse is down.
  function saveMouseMovement(e: MouseEvent<HTMLDivElement>) {
    if (!mouseDown.current || playing.current) return;
    movement.current.X = e.nativeEvent.offsetX;
    movement.current.Y = e.nativeEvent.offsetY;
    movement.current.dX = e.nativeEvent.movementX + movement.current.dX;
    movement.current.dY = e.nativeEvent.movementY + movement.current.dY;
    // console.log("mouse new position after movement", movement.current);
    e.stopPropagation();
    e.preventDefault();
  }

  // the home page has two windows. One is for editing a composition
  // the other is for previewing a composition.
  // Since preview can be invoked from a generator edit dialog,
  // that dialog will be redisplayed after preview is complete.
  return (
    <>
      <Helmet>
        <title> {appName} </title>
      </Helmet>
      {mode != PLAYMODE.preview && mode != PLAYMODE.solo ? (
        <div
          className="page"
          id="page"
          onMouseUp={() => onMouseUp()}
          onMouseDown={(e) => onMouseDown(e)}
          onMouseMove={(e) => saveMouseMovement(e)}
        >
          <Header />
          <Body />
          <Footer />
        </div>
      ) : (
        <Preview sourceData={sourceData} setMode={setMode} />
      )}
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
