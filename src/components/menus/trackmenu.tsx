// the diplay and interaction includes
// the commands to change track name, mute, solo, adjust volume, adjust pan
// add sound generators

import { MouseEvent, useState } from "react";
import {MenuAction, findCommand, MENUS} from "../../types/types";
import { Button, MenuItem } from "@mui/material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import NewIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete'
import { StyledMenu } from "./styledMenu";
import TrackActions from "../../actions/trackactions";
import CGMFile from "../../classes/cgmfile";
import Track from "../../classes/track";

export interface TrackMenuProps {
    selectedTrack: Track | null,
    fileContents: CGMFile | null,
    setFileContents: Function,
    setMessage: Function,
    setStatus: Function,
}

// the component builds the display and widgets to define and manipulate a CGM track
// The display is a box extending across the screen and a control box on the left
// the control box includes
// a delete button
// the track name
// a collpase display button
// a 'additional commands ellipse
// a mute button
// a solo button
// an effects button
// a volume slider
// a pan slider
// to the right of the control box is the display of the effects identified
// each effect is a box display at the start time and is either expanded or collapsed
// The start and end time 

export function TrackMenu (props: TrackMenuProps) {
    const {selectedTrack, fileContents, setFileContents, setMessage, setStatus} = props;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [action, setAction] = useState<MenuAction | null>(null);
  const open: boolean = Boolean(anchorEl);

  const handleButtonClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  }
  const handleAction = (event: MouseEvent<HTMLLIElement>) => {
    const id: string = event.currentTarget.id;
    const thisAction: MenuAction | null = findCommand(MENUS.TRACKS, id);
    if (thisAction) {
      setAction(thisAction);
    }
    setAnchorEl(null);
  }

  return (
    <>
      <Button
        id="track-button"
        aria-controls={open ? 'track-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="contained"
        disableElevation
        disabled={!fileContents}
        onClick={handleButtonClick}
        endIcon={<KeyboardArrowDownIcon />}
      >
        Track
      </Button>
      <StyledMenu
        id="track-menu"
        MenuListProps={{
          'aria-labelledby': 'track-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}

      >
        <MenuItem
          id='NEW'
          onClick={event => handleAction(event)}
          disableRipple>
          <NewIcon />
          New...
        </MenuItem>
        <MenuItem
          id='REMOVE'
          onClick={event => handleAction(event)}
          disableRipple>
          <DeleteIcon />
          Remove
        </MenuItem>
      </StyledMenu>
      <TrackActions
        action={action}
        selectedTrack={null}
        setMessage={setMessage}
        setStatus={setStatus}
        setFileContents={setFileContents}
        fileContents={fileContents as CGMFile}
      />
    </>
  );

}