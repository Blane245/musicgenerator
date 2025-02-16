import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import "./App.css";
import { useCMGContext } from "./cmgcontext";
import Body from "./layouts/body";
import Footer from "./layouts/footer";
import Header from "./layouts/header";

export default function App() {
  const {
    setScreenHeight,
    setScreenWidth,
    setBodyHeight,
    setVerticalScrollWidth,
    setMouseDown,
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

  const titleHeight: number = 180;
  const footerHeight: number = 180;

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
      setScreenWidth(window.innerWidth);
      setBodyHeight(window.innerHeight - titleHeight - footerHeight);
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
        <Body top={titleHeight} />
        <Footer />
      </div>
    </>
  );
}
