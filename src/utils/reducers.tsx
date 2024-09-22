import { Preset } from "../types/soundfonttypes";
import { Sinusoid } from "../types/types";

export function sinusoidReducer(state: Sinusoid, action: { type: string, item: number | string }): Sinusoid {
    const { item, type } = action
    switch (type) {
        case 'preset':
            state.preset = JSON.parse(item as string) as Preset;
            return state;
        case 'centerMidi':
            state.centerMidi = item as number;
            return state;
        case 'modulation':
            state.modulation = item as number;
            return state;
        case 'start':
            state.start = item as number;
            return state;
        case 'stop':
            state.stop = item as number;
            return state;
        case 'volume':
            state.volume = item as number;
            return state;
        default:
            return state;
    }
}

export function validate(name: string, value: number | string): boolean {

    if (typeof value == 'string' && name == 'preset')
        return true;
    if (typeof value == 'number' &&
        ['centerMidi',
            'modulation',
            'start',
            'stop',
            'volume'].includes(name))
        return true;
    return false;
}
