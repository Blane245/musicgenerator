import { MouseEvent, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useCMGContext } from "../cmgcontext";
import Body from "../layouts/body";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import {
  DEFAULTLOCALSFURI,
  DEFAULTSERVERSFURI,
  MouseLocation,
  SFFILELOCATIONITEM,
  SFLOCALURIITEM,
  SFSERVERURIITEM,
  SOUNDFONTLOCATIONOPTIONS,
} from "../types";
import setCursor from "../utils/setcursor";
import "./home.css";
export default function Home() {
  const {
    setScreenHeight,
    setScreenWidth,
    setBodyHeight,
    setVerticalScrollWidth,
    mouseDown,
    setMouseLocation,
    setSFLocalURI,
    setSFServerURI,
    playing,
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

  const footerHeight: number = 180;
  const movement = useRef<MouseLocation>({ X: 0, Y: 0, dX: 0, dY: 0 });

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
      setScreenWidth(window.innerWidth);
      setBodyHeight(window.innerHeight - 80 - footerHeight);
      setVerticalScrollWidth(
        window.innerWidth - document.documentElement.clientWidth
      );
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  // get the soundfont file location from local storage at startup
  // default to server
  useEffect(() => {
    let location: string | null =
      window.localStorage.getItem(SFFILELOCATIONITEM);
    if (!location) {
      window.localStorage.setItem(
        SFFILELOCATIONITEM,
        SOUNDFONTLOCATIONOPTIONS.Server
      );
      window.localStorage.setItem(SFLOCALURIITEM, DEFAULTLOCALSFURI);
      location = SOUNDFONTLOCATIONOPTIONS.Server;
    }
    location = window.localStorage.getItem(SFLOCALURIITEM);
    if (!location) {
      window.localStorage.setItem(SFLOCALURIITEM, DEFAULTLOCALSFURI);
      location = DEFAULTLOCALSFURI;
    }
    setSFLocalURI(location);
    location = window.localStorage.getItem(SFSERVERURIITEM);
    if (!location) {
      window.localStorage.setItem(SFSERVERURIITEM, DEFAULTSERVERSFURI);
      location = DEFAULTSERVERSFURI;
    }
    setSFServerURI(location);
  }, []);

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

  return (
    <>
      <Helmet>
        <title> Computer Music Generator </title>
      </Helmet>
      <div
        className="page"
        id="page"
        onMouseUp={() => onMouseUp()}
        onMouseDown={(e) => onMouseDown(e)}
        onMouseMove={(e) => saveMouseMovement(e)}
      >
        <Header
          appName="Computer Music Generator"
          appVersion={import.meta.env.VERSION}
        />
        <Body />
        <Footer />
      </div>
    </>
  );
}
