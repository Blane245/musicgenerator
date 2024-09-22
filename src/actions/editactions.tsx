import { useEffect } from "react";
import { MenuAction } from "../types/types";
import CGMFile from "../classes/cgmfile";

export interface EditActionsProps {
    action: MenuAction | null,
    setMessage: Function,
    setStatus: Function,
    setFileContents: Function,
    fileContents: CGMFile | null
}
export default function EditActions(props: EditActionsProps) {
    const { action, setMessage, setStatus, setFileContents, fileContents } = props;
    const command = action ? action.command : null;
    useEffect(() => {
        switch (command) {
            case 'REDO':
                // do the check for saved file contents
                setMessage({error:true, text:'Edit redo not implemented'})
                break;
            case 'UNDO':
                // display a file open dialog and set the file contents accoridngly
                setMessage({error:true, text:'Edit undo not implemented'})
                break;
            default:
                setMessage({error:true, text:`Edit ${command} not implemented`})
                break;
        }
    }, [action])

    return (
        <>
    </>
)
}
