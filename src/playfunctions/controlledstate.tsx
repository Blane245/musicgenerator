// these functions hold the state of the fileContents before preview and record and 

import CMGFile from "classes/cmgfile";

// restore it afterward
let savedState:CMGFile|null = null;

export function saveControlledState(fileContents: CMGFile) {savedState = fileContents.copy()}
export function restoreControlledState(): CMGFile | null {
    if (!savedState) return null;
    return savedState.copy();
}