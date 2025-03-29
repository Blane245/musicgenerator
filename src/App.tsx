import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import "./App.css";
import { useCMGContext } from "./cmgcontext";
import Body from "./layouts/body";
import Footer from "./layouts/footer";
import Header from "./layouts/header";
import fetchData from "./utils/fetchdata";

export default function App() {
  const {
    setScreenHeight,
    setScreenWidth,
    setBodyHeight,
    setVerticalScrollWidth,
    setMouseDown,
    setSFFileList,
    setStatus,
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

  // load the list of soundfont files at startup
  useEffect(() => {
    async function getSFFileList() {
      const uri = "/soundfonts/list";
      const response = await fetchData(uri, "GET");
      if (!response.error) {
        const newList = response.list;
        newList.unshift("select a file");
        setSFFileList(newList);
      } else
        setStatus("CMG: error file reading soundfont file list");
    }
    getSFFileList();
  }, []);


  return (
    <>
      <Helmet>
        <title> Computer Music Generator </title>
      </Helmet>
      <div className="page" id="page" onMouseUp={() => setMouseDown(false)}>
        <Header
          appName="Computer Music Generator"
          appVersion={import.meta.env.PACKAGE_VERSION}
        />
        <Body />
        <Footer />
      </div>
    </>
  );
}
