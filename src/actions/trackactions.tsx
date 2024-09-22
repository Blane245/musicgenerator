import { useEffect } from "react";
import { MenuAction } from "../types/types";
import Track from "../classes/track";
import CGMFile from "../classes/cgmfile";

export interface TrackActionsProps {
    action: MenuAction | null,
    selectedTrack: Track | null,
    setMessage: Function,
    setStatus: Function,
    setFileContents: Function,
    fileContents: CGMFile
}
export default function TrackActions(props: TrackActionsProps) {
    const { action, selectedTrack, setMessage, setStatus, setFileContents, fileContents } = props;
    const command = action ? action.command : null;
    useEffect(() => {
        switch (command) {
            case 'NEW':
                // do the check for saved file contents
                const nextTrackNumber = fileContents.tracks.length;
                const newTrack = new Track (nextTrackNumber+1);
                setFileContents((c:CGMFile) => {
                    const newC:CGMFile = c.copy();
                    newC.tracks.push(newTrack);
                    return newC;
                })
                setStatus('New Track added');
                setMessage({error:false, text:""});
                break;
            case 'REMOVE':
                // display a file open dialog and set the file contents accoridngly
                if (!selectedTrack)
                    setMessage({ error: true, text: 'A track must be selected before it can be removed' })
                else {
                    setFileContents((c:CGMFile) => {
                        const newC:CGMFile = c.copy();                        
                        const newTracks = newC.tracks.map((t:Track) => {
                            if (t.name != selectedTrack.name)
                                return t;
                            else
                                return null;
                        }).filter((t) => t);
                            if (newTracks) newC.tracks = newTracks as Track[];
                            else newC.tracks = [];
                        return newC;
                    });
                    setStatus(`Track ${selectedTrack.name} removed`)
                    setMessage({error:false, text:""})
                }
                break;
            default:
                setMessage({ error: true, text: `Edit ${command} not implemented` })
                break;
        }
    }, [action])

    return (
        <>
        </>
    )
}
