import CMGFile from "classes/cmgfile";
import GlissandoCloud from "classes/stochastic/glissandocloud";
import PercussionCloud from "classes/stochastic/percussioncloud";
import PizzicatoCloud from "classes/stochastic/pizzicatocloud";
import SustainedCloud from "classes/stochastic/sustainedcloud";
import Track from "classes/track";
import {
  CloudType,
  Composition,
  CompositionVersionEntry,
  CompositionVersionList,
  CompositionVersions,
  GENERATORTYPE,
  StochasticValues,
  TIMBRE,
} from "types";
import poisson from "utils/probability/poisson";
import Silent from "./silent";
import continuousProbability from "utils/probability/continuousprobability";

export default class Stochastic extends Silent {
  values: StochasticValues = 
{
    length: 0,
    Tc: 0,
    B: 0,
    deltaT: 0,
    Nm: 0,
    cellCount: 0,
    Nt: 0,
    Ne: 0,
    timbres: [],
    composition: [],
    lambda: 0,
    delta: 0,
    cellDistribution: [],
    pizzDuration: 0,
    percDuration: 0,
  };
  compositionVersions: CompositionVersions; // the saved conpositions
  #durationDistribution: number[] = []; // the duration probability table based on linear density

  constructor(nextGenerator: number, parent: Track) {
    super(nextGenerator, parent);
    this.type = GENERATORTYPE.Stochastic;
    this.compositionVersions = new Map();
  }

  // construct the composition matrix and set up the various probability tables
  // the cell distribution for the time and timbre matrix
  // the continuous probability with mean linear density and unit of 0.1 of a measure for use by duration
  // the interval probability with length as DeltaT, the time cell length for use by pitch
  build(): string[] {
    const e: string[] = Stochastic.validate(this, null, "");
    if (e.length > 0) return e;
    this.values.Nt = this.values.length / this.values.Nm; // number of time cells
    this.values.deltaT = (this.values.Nm * this.values.B) / 60; // cell length (secs)
    this.values.Tc = this.values.deltaT * this.values.length; // composition length (sec)
    this.stopTime = this.startTime + this.values.Tc;
    this.values.Ne = this.values.timbres.length; // number of timbres

    // get the cell count distribution with mean density lambda
    this.values.cellDistribution = [];
    this.values.cellCount = this.values.Nt * this.values.Ne;
    let cellCount: number = Math.round(
      poisson(0, this.values.lambda) * this.values.cellCount
    );
    let k: number = 0;
    while (cellCount > 0) {
      this.values.cellDistribution.push(cellCount);
      k++;
      cellCount = Math.round(poisson(k, this.values.lambda) * this.values.cellCount);
    }

    // create the composition matrix
    this.values.composition = [];
    for (let i: number = 0; i < this.values.Nt; i++) {
      this.values.composition[i] = [];
      for (let j: number = 0; j < this.values.Ne; j++) {
        this.values.composition[i][j] = { cell: { mean: 0, type: null } };
      }
    }

    // distribute the events to the composition randomly, without replacement
    for (let i: number = 1; i < this.values.cellDistribution.length; i++) {
      // get a random cell index
      for (let j: number = 0; j < this.values.cellDistribution[i]; j++) {
        let row: number = Math.round(Math.random() * (this.values.Nt - 1));
        let column: number = Math.round(Math.random() * (this.values.Ne - 1));
        while (this.values.composition[row][column].cell.mean != 0) {
          console.log("stochastic build: occupied cell skipped", row, column);
          row = Math.round(Math.random() * (this.values.Nt - 1));
          column = Math.round(Math.random() * (this.values.Ne - 1));
        }

        // determine the number of sounds/cell based on the cell event count
        // and the sound density
        const deltaCell: number = // sounds/cell
          this.values.delta * // sounds/sec
          this.values.deltaT * // sec / cell
          (i / (this.values.cellDistribution.length - 1)); // portion allocated
        this.values.composition[row][column].cell.mean = deltaCell;

        const timbre: TIMBRE = TIMBRE[row];
        switch (timbre) {
          case TIMBRE.Glissando:
            this.values.composition[row][column].cell.type = new GlissandoCloud();
            break;
          case TIMBRE.Percussion:
            this.values.composition[row][column].cell.type = new PercussionCloud();
            break;
          case TIMBRE.Pizzicato:
            this.values.composition[row][column].cell.type = new PizzicatoCloud();
            break;
          case TIMBRE.Sustained:
            this.values.composition[row][column].cell.type = new SustainedCloud(row * this.values.deltaT);
            break;
        }
      }
    }
    this.#durationDistribution = continuousProbability(
      this.values.delta, // sounds / second
      0.01 *this.values.deltaT / this.values.Nm); // 1/10th of a measure
    
    return [];
  }

  // save the current composition matrix
  saveCompositionVersion(name: string, comment: string): void {
    const now: Date = new Date();
    this.compositionVersions[name] = {
      comment: comment,
      dateCreated: now,
      dateUpdated: now,
      Composition: this.values,
    };
  }

  // update one of the saved composition matrices
  updateCompositionVersion(
    name: string,
    comment: string,
    object: Stochastic
  ) {
    const thisVersion: CompositionVersionEntry = {
      ...this.compositionVersions[name],
    };
    thisVersion.comment = comment;
    thisVersion.values = object.values;
    thisVersion.dateUpdated = new Date();
    this.compositionVersions[name] = thisVersion;
  }

  // delete one of the saved composition matrices
  deleteCompositionVersion(name: string) {
    this.compositionVersions[name].delete();
  }

  // list all of the composition matrices
  listCompositionVersions(): CompositionVersionList[] {
    return Array.from(this.compositionVersions, ([key, value]) => ({
      name: key,
      comment: value.comment,
      dateCreated: value.dateCreated,
      dateUpdated: value.dateUpdated,
    })).sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  activateCompositionVersion(name: string) {
    this.values = this.compositionVersions[name];
  }

  override copy(parent: Track): Stochastic {
    const n: Stochastic = new Stochastic(0, parent);
    n.name = this.name;
    n.startTime = this.startTime;
    n.stopTime = this.stopTime;
    n.values = {...this.values};
    return n;
  }

  override setAttribute(name: string, value: string): boolean {
    if (super.setAttribute(name, value)) return true;
    switch (name) {
      case "length":
        this.values.length = parseFloat(value);
        return true;
      case "Nm":
        this.values.Nm = parseFloat(value);
        return true;
      case "B":
        this.values.B = parseFloat(value);
        return true;
      case "lambda":
        this.values.lambda = parseFloat(value);
        return true;
      case "delta":
        this.values.delta = parseFloat(value);
        return true;
      case "pizzDuration":
        this.values.pizzDuration = parseFloat(value);
        return true;
      case "percDuration":
        this.values.percDuration = parseFloat(value);
        return true;
      case "timbres":
        this.values.timbres = value.split(",") as TIMBRE[];
        return true;
    }
    return false;
  }

  //TODO write all the values and the versions
  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    return Promise.resolve(elem);
  }
  //TODO read all of the values and the versions
  static override async getXML(
    elem: Element,
    version: string,
    parent: Track
  ): Promise<Stochastic> {
    try {
      const n: Stochastic = new Stochastic(0, parent);
      return Promise.resolve(n);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static override validate(
    g: Stochastic,
    _fileContents: CMGFile | null,
    _oldName: string
  ): string[] {
    const e: string[] = [];
    if (g.values.length <= 0) e.push("Composition length must be positive");
    if (g.values.B <= 0) e.push("Measurement speed must be positive.");
    if (g.values.Nm <= 0) e.push("Measure count must be positive.");
    if (g.values.lambda <= 0) e.push("Event density must be positive.");
    if (g.values.delta <= 0) e.push("Sound density must be positive");
    if (g.values.timbres.length == 0) e.push("At least one timbre must be specified.");
    return [];
  }
}
// lowIntensity: number = 0; // (phons >= 0)
// highIntensity: number = 100; // (phons <= 120)
// Ni: number = 10;
// phons: number[] = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900]; // low value of phon cell

// lowPitch: number = 20; // (Hz) (>= 20)
// highPitch: number = 15000; // (Hz) (<= 22,000)
// Nf: number = 10; // number of frequency cells (highPitch - lowPitch)
// pitches: number[] = []; // low value of frequency cell (cells sizes distributed logrithmic)

// lowDuration: number = 0.05; // (sec > 20-50 ms)
// highDuration: number = 3.05; // (sec < deltaT)
// Nd: number = 3;
// durations: number[] = [0.05, 1.05, 2.05]; // low value of duration cell

// lowPan: number = -90; // deg >= -90
// highPan: number = +90; // deg <= 90
// Np: number = 9; // number of pan cells
// pans: number[] = [-90, -70, -50, -30, -10, +10, +30, +50, +70];

// Nc: number = 6 * 10 * 10 * 3 * 9; // Nt * ni * nf * nd * np = 16,200

// lambda: number = 0.6; // sound event mean density (events/deltaT);
// Ne: number[] = []; // cell counts (Possion distribution)
// cellDistribution:[][][][][][] = []; // cell distribution versions.
// // dimensions are
// // 1. time
// // 2. pitch
// // 3. intensity
// // 4. duration
// // 5. pan
// // 6. version
