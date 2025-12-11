// parent class of the timbre clouds
// timbre clouds are created for each cell in the composition matrix
// when it is realized

import { TIMBRE } from "types";

export default class Cloud {
    type: TIMBRE = TIMBRE.None;
    values: {} = {};
    copy(): Cloud {
        const n: Cloud = new Cloud();
        return n;
    }



}

