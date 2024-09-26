import { SoundFont2 } from "soundfont2";
import Track from "../classes/track";

export type Message = { text: string, error: boolean }

export const MENUS = Object.freeze({
    FILE: 0,
    EDIT: 1,
    TRACKS: 2,
});

export const COMMANDS = [
    {
        menu: MENUS.FILE,
        menuCommands: ['NEW', 'OPEN', 'SAVE', 'SAVEAS']
    },
    {
        menu: MENUS.EDIT,
        menuCommands: ['REDO', 'UNDO']
    },
    {
        menu: MENUS.TRACKS,
        menuCommands: ['NEW', 'REMOVE']
    }
]
export type Menu = number;

export type Command = string;

export type MenuAction = { menu: Menu, command: Command, toDo?: any }

export function findCommand(menu: Menu, name: string): MenuAction | null {
    const menuIndex: number = COMMANDS.findIndex((entry) => menu == entry.menu);
    if (menuIndex >= 0) {
        const commandIndex: number = COMMANDS[menuIndex].menuCommands
            .findIndex((entry) => name == entry);
        if (commandIndex >= 0)
            return { menu: COMMANDS[menuIndex].menu, command: COMMANDS[menuIndex].menuCommands[commandIndex] }
        return null;
    }
    return null;
}

export type SFFile = { name: string }

export type SFFiles = SFFiles[];

export const ModalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export enum TIMELINESTYLE {
    SECONDS_MINUTES = 0,
    BEATS_MEASURES = 1,
};

export type TimeSignature = {
    beatsPerMeasure: number, // 1-100
    measureUnit: number, // 2, 4, 8, 16, 32, 64
}

export enum MEASURESNAPUNIT {
    'Bar' = 0,
    '1/2',
    '1/4',
    '1/8',
    '1/16',
    '1/32',
    '1/64',
    '1/128',
    '1/2 triplets',
    '1/4 triplets',
    '1/8 triplets',
    '1/16 triplets',
    '1/32 triplets',
    '1/64 triplets',
    '1/128 triplets',
}
export enum SECONDSNAPUNIT {
    'Seconds' = 0,
    'Deciseconds',
    'Centiseconds',
    'Milliseconds',
}

export enum MODULATOR {
    'SINE',
    'SQUARE',
    'TRIANGLE',
    'SAWTOOTH',
}
export enum MODULATORCLASS {
    Frequency,
    Volume,
    Pan,
}
export enum TIMEFORMATTYPE {
    NUMBER,
    TIME,
}

export type TimeFormat = {
    value: string,
    type: TIMEFORMATTYPE,
}
export const TIMEFORMATS:TimeFormat[]  = [
    {value:'0.000000',type:TIMEFORMATTYPE.NUMBER},
    {value:'0.0000',type:TIMEFORMATTYPE.NUMBER},
    {value:'0.000',type:TIMEFORMATTYPE.NUMBER},
    {value:'0.00',type:TIMEFORMATTYPE.NUMBER},
    {value:'0.0',type:TIMEFORMATTYPE.NUMBER},
    {value:'00.0',type:TIMEFORMATTYPE.NUMBER},
    {value:'0:00',type:TIMEFORMATTYPE.TIME},
    {value:'00:00',type:TIMEFORMATTYPE.TIME},
    {value:'0:00:00',type:TIMEFORMATTYPE.TIME},
    {value:'0:00:00',type:TIMEFORMATTYPE.TIME},
    {value:'000:00:00',type:TIMEFORMATTYPE.TIME},
]
export type TimeLineScale = {
    extent: number, // the extents of the time scale in seconds
    majorDivisions: number, // the number of divisions in the time scale
    minorDivisions: number, // the number of division in each major division
    format: number, // index of format to use when displaying time
}

export const TimeLineScales:TimeLineScale[] = [
    {extent: 0.00002, majorDivisions: 10, minorDivisions: 4, format: 0},
    {extent: 0.00004, majorDivisions: 8, minorDivisions: 5, format: 0},
    {extent: 0.00008, majorDivisions: 8, minorDivisions: 2, format: 0},
    {extent: 0.00016, majorDivisions: 16, minorDivisions:2, format: 0},
    {extent: 0.003, majorDivisions: 6, minorDivisions: 5, format: 1},
    {extent: 0.006, majorDivisions: 6, minorDivisions: 2, format: 1},
    {extent: 0.013, majorDivisions: 13, minorDivisions: 2, format: 1},
    {extent: 0.025, majorDivisions: 25, minorDivisions: 2, format: 1},
    {extent: 0.05, majorDivisions: 10, minorDivisions: 5, format: 2},
    {extent: 0.1, majorDivisions: 10, minorDivisions: 2, format: 2},
    {extent: 0.21, majorDivisions: 21, minorDivisions: 2, format: 2},
    {extent: 0.4, majorDivisions: 8, minorDivisions: 5, format: 2},
    {extent: 0.8, majorDivisions: 8, minorDivisions: 2, format: 2},
    {extent: 1.7, majorDivisions: 17, minorDivisions: 2, format: 3},
    {extent: 3., majorDivisions: 6, minorDivisions: 5, format: 4},
    {extent: 6., majorDivisions: 6, minorDivisions: 2, format: 4},
    {extent: 13., majorDivisions: 13, minorDivisions: 2, format: 5},
    {extent: 27., majorDivisions: 27, minorDivisions: 2, format: 5},
    {extent: 50., majorDivisions: 10, minorDivisions: 5, format: 5},
    {extent: 105., majorDivisions: 7, minorDivisions: 3, format: 6},
    {extent: 210., majorDivisions: 14, minorDivisions: 3, format: 6},
    {extent: 420., majorDivisions: 14, minorDivisions: 3, format: 6},
    {extent: 840., majorDivisions: 14, minorDivisions: 2, format: 7},
    {extent: 1800., majorDivisions: 6, minorDivisions: 5, format: 7},
    {extent: 3600., majorDivisions: 4, minorDivisions: 3, format: 8},
    {extent: 7200., majorDivisions: 8, minorDivisions: 3, format: 8},
    {extent: 14400., majorDivisions: 16, minorDivisions: 3, format: 8},
    {extent: 28800., majorDivisions: 16, minorDivisions: 3, format: 8},
    {extent: 54000., majorDivisions: 15, minorDivisions: 2, format: 9},
    {extent: 108000., majorDivisions: 5, minorDivisions: 5, format: 9},
    {extent: 216000., majorDivisions: 3, minorDivisions: 4, format: 9},
    {extent: 432000., majorDivisions: 5, minorDivisions: 4, format: 10},
    {extent: 604000., majorDivisions: 7, minorDivisions: 4, format: 10},
    {extent: 1209600., majorDivisions: 2, minorDivisions: 7, format: 10},
 ]

export enum GENERATORTYPES  {
    "CMG",
    "SFPG",
    "SFRG",
}