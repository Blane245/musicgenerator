// activate a globalcontrol for review and record

import CMGFile from "classes/cmgfile";
import { Control, GlobalEffect } from "classes/control";

export function activateGlobalControl (time: number, ctl: Control, fileContents: CMGFile): void {
    const gEffect: GlobalEffect = ctl.effect as GlobalEffect;  
    
    const {reverbEnable, compressorEnable, equalizerEnable, volume} = gEffect.getCurrentValues(time);
    gEffect.initializeVolumeRamp(time, fileContents.volume.volume);
    fileContents.reverb.setAttribute('reverb.enabled', reverbEnable.toString());
    fileContents.compressor.setAttribute('compressor.enabled', compressorEnable.toString());
    fileContents.equalizer.setAttribute('equalizer.enabled', equalizerEnable.toString());
    fileContents.volume.setVolume(volume);
    // setFileContents(fileContents.copy());
}

export function processGlobalControl (time: number, ctl:Control, fileContents: CMGFile): void {
    const {volume} = (ctl.effect as GlobalEffect).getCurrentValues(time);
    fileContents.volume.setVolume(volume);
    console.log('global volume at time', volume, time);
    // setFileContents(fileContents.copy());
}