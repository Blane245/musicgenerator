import { Helmet } from "react-helmet-async";
import "./App.css";
import { useCMGContext } from "./cmgcontext";
import Body from "./layouts/body";
import Footer from "./layouts/footer";
import Header from "./layouts/header";

export default function App() {
  const { setMouseDown } = useCMGContext();

  return (
    <>
      <Helmet>
        <title> Computer Music Generator </title>
      </Helmet>
      <div className="page" id="page" onMouseUp={() => setMouseDown(false)}>
        <div className="page-grid">
          <Header
            appName="Computer Music Generator"
            appVersion={import.meta.env.PACKAGE_VERSION}
          />
          <Body />
          <Footer />
        </div>
      </div>
    </>
  );
}
