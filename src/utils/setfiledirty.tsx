import CMGFile from "classes/cmgfile"

export default function setFileDirty (setFileContents: Function):void {
    setFileContents((c:CMGFile) => {
        const newC:CMGFile = c.copy();
        newC.dirty = true;
        return newC;
    })
}