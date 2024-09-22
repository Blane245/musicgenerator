import { MenuAction, ModalStyle } from "../types/types";
import { Box, Button, Modal, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import CGMFile from "../classes/cgmfile";

export interface FileActionsProps {
    action: MenuAction | null,
    setMessage: Function,
    setStatus: Function,
    setFileContents: Function,
    fileContents: CGMFile | null
}
export default function FileActions(props: FileActionsProps) {
    const { action, setMessage, setStatus, setFileContents, fileContents } = props;
    const command = action ? action.command : null;
    const [openFileNew, setOpenFileNew] = useState<boolean>(false);
    useEffect(() => {
        switch (command) {
            case 'NEW':
                // do the check for saved file contents
                if (fileContents && fileContents.dirty)
                    setOpenFileNew(true);
                else {
                    const contents: CGMFile = new CGMFile();
                    setFileContents(contents);
                    setStatus('New file started');
                }
                break;
            case 'OPEN':
                // display a file open dialog and set the file contents accoridngly
                setMessage({ error: true, text: 'File to be opened and loaded' })
                break;
            case 'SAVE':
                // the file will be saved to in its current location
                setMessage({ error: true, text: 'File to be Saved' });
                break;
            case 'SAVEAS':
                setMessage({ error: true, text: 'File save as to be implemented' })
                break;
            default:
                setMessage({ error: true, text: `File ${command} not implemented` })
                break;
        }
    }, [action])
    function handleCloseFileNew() {
        setOpenFileNew(false);
    }
    function handleFileNewCancel() {
        setOpenFileNew(false);
    }

    function handleFileNewOK() {
        const contents = new CGMFile();
        setFileContents(contents);
        setOpenFileNew(false);
        setStatus('New file started');
    }

    return (
        <>
            <Modal
                id='filenew'
                open={openFileNew}
                onClose={handleCloseFileNew}

            >
                <Box sx={ModalStyle}>
                    <Typography>
                        The current file has not been saved. Do you wish to delete its contents withut saving?
                    </Typography>
                    <Button
                        variant='outlined'
                        onClick={handleFileNewOK}
                    >
                        OK
                    </Button>
                    <Button
                        variant='outlined'
                        onClick={handleFileNewCancel}
                    >
                        Cancel
                    </Button>

                </Box>
            </Modal>
        </>
    )
}
