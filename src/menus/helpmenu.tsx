// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
export default function HelpMenu() {

  // handle request to create a new file
  // If the curretn one is 'dirty' the user is
  // prompted to confirm overwrite
  function handleAbout() {
  }

  // handle request to open a file.
  // if the current one is 'dirty' the user is asked to confirm over-write
  function handleGuide() {
  }

  function handleMenuSelect(action: string) {
    switch (action) {
      case "about":
        handleAbout();
        break;
      case "guide":
        handleGuide();
        break;
      default:
        break;
    }
  }

  return (
    <>
    <fieldset>
    <div className="navbar">
        <div className="dropdown">
          <div className="dropbtn">
            Help
            <i className="fa fa-caret-down"></i>
          </div>
          <div className="dropdown-one">
              <a className="dItem" onClick={() => handleMenuSelect("about")}>
                About CMG...
              </a>
              <a className="dItem" onClick={() => handleMenuSelect("guide")}>
                CMG User's Guide...
              </a>
            </div>
        </div>
      </div>
      </fieldset>
    </>
  );
}
