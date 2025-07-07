#Enhancements
- disable delay of a preset. For presets that have multiple instruments, the shortest delay is removed and the other instrument delays are shortened. 
#Bugs
- generator icon menus having problems scrolling
- timeprogress has a creep as time advances
- when opening a file and the timeline is not the default, generator icons has a problem keeping track of the icons to display. 
- some sort of opps in right wall reverb. hang up
#3.6.0 Release notes
- Change midi to note notation to cents, e.g., C4+30
- Implemented autoregressive algorithm for algorithmic generator
- Implemented constant algorithm for algorithmic generator
- Updated report write to include silent generator and constant and autoregressice algorithms. 
- Fixed attentuation field in source report.
- Improved mouse actions on timeline to define and move timeinterval
- implemented generator move in time and improved vertical position movement

#timeinterval use cases
- Modes of operations
    - NONE (no operations are in progress)
    - DEFINE (timeinterval is being defined)
    - MOVE (body is being moved)
- Mouse State
    - CLICKED - primary mouse button pressed true or false
- Edge State
    - NONE - body move
    - LEFT - left edge clicked
    - RIGHT - right edge clicked
- Timeinterval Actions
    -A timeinterval definition starts when the user clicks the mouse while in the time line (not within an existing timeinterval). The definition continues until the user releases the mouse button. No cursor changes occur during this definition. 
    - If a timeinterval exists and the user moves the mouse into the body of the interval wihth the mouse button up, the cursor changes to hand. A body move is started when the mouse is clicked and continues until the mouse is released. Teh cursor will stay as hand if the mouse is within the timeinterval or change to default if not. Moving out of the timeinterval body with the mouse up changes the cursor to either sizeWE or default depending on where it is located.
    - If a timeinterval exists and the user moves the mouse into either the left or right edge, the cursor changes to sizeWE. A redefinition is started when the mouse is clicked and continues until the mouse is released. When released, the cursor will remain as sizeWE if the cursor is in either the left or right edge, changed to hand if in the timeinterval body, or changes to default if not.
- Actions 
    - Mode NONE
        - mouse move into timeinterval with ~CLICKED
            - change cursor to hand
        - mouse move out of timeinterval with ~CLICKED
            - change cursor to default
        - move move into timeinterval left edge ~CLICKED
            - change cursor to sizeWE
            - change edge state to LEFT
        - move move out of timeinterval left edge ~CLICKED
            - change cursor to default
        - move move into timeinterval right edge ~CLICKED
            - change cursor to sizeWE
            - change edge state to RIGHT
        - move move out of timeinterval right edge ~CLICKED
            - change cursor to default
        - primary mouse down when in timeline
            - change mouse state to CLICKED
            - change mode to DEFINE
            - change cursor to sizeWE
            - change edge state to LEFT
            - initiate timeinterval definition
        - primary mouse down when in timeinterval left edge
            - change mouse state to CLICKED
            - change mode to DEFINE
            - change cursor to sizeWE
            - change edge state to LEFT
        - primary mouse down when in timeinterval right edge
            - change mouse state to CLICKED
            - change mode to DEFINE
            - change cursor to sizeWE
            - change edge state to RIGHT
        - primary mouse down when in timeinterval
            - change mode to MOVE
            - change mouse state to CLICKED
    - Mode DEFINE
        - mouse move anywhere while CLICKED (including out of window)
            - capture new X location and change timeinterval extents
            - modify timeinterval definition
        - primary mouse button up anywhere
            - change cursor to default
            - terminate new definition 
            - change mouse state to ~CLICKED
            - change mode to NONE
    - Mode MOVE
        - mouse move anywhere (including of of window)
            - capture new X location and move timeinterval
        - priamry mouse button up anywhere
            - terminate body move
            - change mouse state to ~CLICKED
            - change mode to NONE
            - change cursor depending on if in the timeinterval (hand) or not (default)

code to throttle mouse movements
function ThrottledMouseMove() {
  let timeoutId = null;

  function handleMouseMove(event) {
    if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        console.log('Mouse position:', event.clientX, event.clientY);
        timeoutId = null;
      }, 100);
    }
  }

  return (
    <div onMouseMove={handleMouseMove}>
      Move your mouse over me!
    </div>
  );
}

handle mouse up anywhere in a window
have SetMouseDown call in hame <DIV/>

#Generator mouse use cases
Generators can be moved up and down within the track to position them away from other generators. They
can be moved left and right to change their start and stop times. Their edges can be moved
to change either their start or stop time.

The problem is not enough click space. A click on the icon body activates the vertical move. A click on the text
activates the menu. The only things availble to click are the ends. I elect to make this a body move rather
than a change of start or stop time independently. So there is no Define mode, only Move Mode.

A click on the icon text activates the generator menu.

A click on the icon body activates the up/down move function

A click on the left or right end of the icon activates the start time/stop time move.

- Modes of operations
    - None 
    - Move Vertical
    - mode Horizontal
- Mouse State
    - MouseDown - true or false
- Mouse Location
    - Mouse position (and movement) when clicked or moved 
- Icon actions
    - Enter icon body and mouseUp
        - change cursor to ns-resize
    - Leave icon body and mouseUp
        - change cursor to default
    - Enter icon left or right edge and mouse up
        - change cursor to grab
    - Leave icon left or right edge and mouse up
        - change cursor to default
    - Mouse click in icon body
        - set mode to move vertical
    - Mouse click in left of right edge 
        - set mode to move horizontal
    - Mouse move and mode is move vertical
        - adjust vertical position within limits
    - Mouse move and mode is move horizontal
        - adjust start and stop times within limits
    - Mouse Up
        - set mode to None
        - set cursor to default