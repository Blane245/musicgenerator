import CMGFile from "classes/cmgfile"

export default function setFileDirty (setFileContents: Function):void {
    setFileContents((prev:CMGFile) => {
        const newC:CMGFile = prev.copy();
        newC.dirty = true;
        return newC;
    })
}