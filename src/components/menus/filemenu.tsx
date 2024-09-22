import NewIcon from '@mui/icons-material/Create';
import OpenIcon from '@mui/icons-material/FileOpen';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import { MouseEvent, useState } from "react";
import FileActions from '../../actions/fileactions';
import { findCommand, MenuAction, MENUS, } from '../../types/types';
import { StyledMenu } from './styledMenu';
import CGMFile from '../../classes/cgmfile';

export interface FileMenuProps {
  fileContents: CGMFile | null,
  setFileContents: Function,
  setMessage: Function,
  setStatus: Function,
}

export default function FileMenu(props: FileMenuProps) {
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
    const thisAction: MenuAction | null = findCommand(MENUS.FILE, id);
    if (thisAction) {
      setAction(thisAction);
    }
    setAnchorEl(null);
  }

  return (
    <>
      <Button
        id="file-button"
        aria-controls={open ? 'file-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="contained"
        disableElevation
        onClick={handleButtonClick}
        endIcon={<KeyboardArrowDownIcon />}
      >
        File
      </Button>
      <StyledMenu
        id="file-menu"
        MenuListProps={{
          'aria-labelledby': 'file-button',
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
          id='OPEN'
          onClick={event => handleAction(event)}
          disableRipple>
          <OpenIcon />
          Open...
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          id='SAVE'

          onClick={event => handleAction(event)}
          disableRipple>
          <SaveIcon />
          Save
        </MenuItem>
        <MenuItem
          id='SAVEAS'

          onClick={event => handleAction(event)}
          disableRipple>
          <SaveAsIcon />
          Save As...
        </MenuItem>
      </StyledMenu>
      <FileActions
        action={action}
        setMessage={setMessage}
        setStatus={setStatus}
        setFileContents={setFileContents}
        fileContents={fileContents}
      />
    </>
  );
}

