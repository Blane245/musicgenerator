import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import { MouseEvent, useState } from "react";
import EditActions from '../../actions/editactions';
import { findCommand, MenuAction, MENUS } from '../../types/types';
import { StyledMenu } from './styledMenu';
import CGMFile from '../../classes/cgmfile';

export interface EditMenuProps {
  fileContents: CGMFile | null,
  setFileContents: Function,
  setMessage: Function,
  setStatus: Function,
}

export default function EditMenu(props: EditMenuProps) {
  const { fileContents, setFileContents, setMessage, setStatus } = props;
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
    const thisAction: MenuAction | null = findCommand(MENUS.EDIT, id);
    if (thisAction) {
      setAction(thisAction);
    }
    setAnchorEl(null);
  }

  return (
    <>
      <Button
        id="edit-button"
        aria-controls={open ? 'edit-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="contained"
        disabled={!fileContents}
        disableElevation
        onClick={handleButtonClick}
        endIcon={<KeyboardArrowDownIcon />}
      >
        Edit
      </Button>
      <StyledMenu
        id="edit-menu"
        MenuListProps={{
          'aria-labelledby': 'edit-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem 
        id='UNDO'
        onClick={event => handleAction(event)} 
        disableRipple>
          <UndoIcon />
          Undo
        </MenuItem>
        <MenuItem 
        id='REDO'
        onClick={event => handleAction(event)} 
        disableRipple>
          <RedoIcon />
          Redo
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
      </StyledMenu>
      <EditActions
              action={action}
              setMessage={setMessage}
              setStatus={setStatus}
              setFileContents={setFileContents}
              fileContents={fileContents}
      
      />
    </>
  );
}

