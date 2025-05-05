import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import "./home.css";
import { useCMGContext } from "../cmgcontext";
import Body from "../layouts/body";
import Footer from "../layouts/footer";
import Header from "../layouts/header";
import { DEFAULTLOCALSFURI, DEFAULTSERVERSFURI, SFFILELOCATIONITEM, SFLOCALURIITEM, SFSERVERURIITEM, SOUNDFONTLOCATIONOPTIONS } from "../types";
export default function Home() {
  const {
    setScreenHeight,
    setScreenWidth,
    setBodyHeight,
    setVerticalScrollWidth,
    setMouseDown,
    setSFLocalURI,
    setSFServerURI,
  } = useCMGContext();

  // set up the the layout and handle screen size changes
  // for height:
  // the page header is set to 160px to accommodate the
  // title, menu, controls, and timeline display
  // the page footer is set to 170px to accommondate
  // the status area and compressor, equalizer and volume controls
  // the page body is set the the remainder of the screen hight
  // for width:
  // all elements are set screen width (css is 100%)
  // when a window.resize event occurs, the screenHeight and screenWidth
  // context attributes are set, affording components to make necessary
  // adjusts to sizes

  const footerHeight: number = 180;

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
    let location: string | null = window.localStorage.getItem(SFFILELOCATIONITEM);
    if (!location) {
      window.localStorage.setItem(SFFILELOCATIONITEM, SOUNDFONTLOCATIONOPTIONS.Server)
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

  },[])
  return (
    <>
      <Helmet>
        <title> Computer Music Generator </title>
      </Helmet>
      <div className="page" id="page" onMouseUp={() => setMouseDown(false)}>
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
