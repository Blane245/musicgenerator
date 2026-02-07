import RandomNumber from "classes/randomnumber";
import { Composition } from "../../types";
import poisson from "../../utils/probability/poisson";
import { debug } from "utils/debug";

interface buildCompositionProps {
  nColumns: number; // the number of columns
  nRows: number; // the number of rows
  lambda: number; // the mean number of events (clouds) per cell
  rN: RandomNumber;
}

// given the size of the composition and the averages for the event count and sounds/second
// build a random composition
// the number of events per cell and the number of event per column are driven by teh Poisson distribution
export default function buildComposition(
  props: buildCompositionProps
): Composition {
  const { nColumns, nRows, lambda, rN } = props;

  // develop the distribution of the frequency among the cells (N)

  const [N] = buildCellDistribution(nColumns * nRows, lambda);
  debug.info('buildComposition: cell frequencies', N);

  // initialize the composition with -1 counts showing that no cells have
  // been populated
  const composition: Composition = [];
  for (let i = 0; i < nRows; i++) {
    composition[i] = [];
    for (let j = 0; j < nColumns; j++) {
      composition[i].push(-1);
    }
  }

  // construct an array that provide an urn to draw out random row numbers
  let rowUrn: number[] = [];
  let rowPick: number = 0;

  // loop through the cell distribution table by frequency (i)
  // to determine the distribuion of cells in each row
  N.forEach((cellCount, i) => {
    // count is the number of cells to be allocation with i events
    // clear the columns allocated for this passa
    if (i == 0) {
       debug.info('buildComposition: skipping', cellCount, 'cells', 'since the number of events is zero');
    } else {
      debug.info('buildComposition: allocating ', cellCount, 'cells with ', i, 'events');

      // develop the distribution of the column's count
      const [Nc] = buildCellDistribution(cellCount, cellCount / nRows);
      debug.info('buildComposition: frequency distribution for count, lambda', cellCount, cellCount / nRows, Nc);

      // reshuffle the row urn
      rowUrn = randomizeIntegers(nRows, rN);
      rowPick = 0;
      debug.info(`buildComposition: new row urn ${rowUrn}`);
      Nc.forEach((rowCount, frequency) => {
        // rowcount is the number of rows to contain frequency events
        debug.info(`buildComposition: processing ${rowCount} rows needing ${frequency} cells`);
        for (let iRow = 0; iRow < rowCount && rowPick < rowUrn.length; iRow++) {
          if (frequency == 0) {
            rowPick++;
            debug.info(`buildComposition: skipping ${iRow} row in ${rowCount} rows since frequency is zero `);
          } else {
            debug.info(`buildComposition: processing ${iRow} row in ${rowCount} rows with frequency ${frequency}`);
            // pick a row number from the row urn
            // check that it has at least frequency available cells
            let cellUrn: number[] = [];
            let rowFound: boolean = false;
            let nRow: number = -1;
            while (!rowFound && rowPick < nRows) {
              nRow = rowUrn[rowPick];
              let nCells: number = 0;
              cellUrn = [];
              composition[nRow].forEach((value, iCell) => {
                if (value < 0) {
                  nCells++;
                  cellUrn.push(iCell);
                }
              });
              if (nCells >= frequency)
                rowFound = true; // there is a row that has enough cells
              else {
                // haven't found a row yet, try another
                rowPick++;
              }
            }

            if (rowPick < nRows) {
              // something went wrong - no rows have enough cells
              // throw new Error(`Event Density is too large for the ensemble and time cell counts `);
              debug.info(`buildComposition: Found row ${nRow} having ${cellUrn.length} available cells`);

              // shuffle the available cells to place the events
              cellUrn = cellUrn.sort(() => rN.rand() - 0.5);

              // there are at least frequency available cells
              // place them in random columns by drawing from the available cells urn
              for (let k = 0; k < frequency; k++) {
                const nColumn: number = cellUrn[k];
                composition[nRow][nColumn] = i;
              }

              // bump to the next row in the urn
              rowPick++;
            }
          }
          // if (rowPick >= nRows)
          // 	// something went wrong - no rows have enough cells
          // 	throw new Error(`Event Density is too large for the ensemble and time cell counts `);
        }
      });
    }
  });

  // finally, place at least one cloud in any row that had none and mark all unallocated cells as having zero clouds
  for (let i = 0; i < nRows; i++) {
    let foundRow: boolean = false;
    for (let j = 0; j < nColumns; j++) {
      if (composition[i][j] < 0) {
        foundRow = true;
        composition[i][j] = 0;
      }
    }
    if (foundRow) {
      // pick a random column and put a cloud there
      const column: number = Math.trunc(rN.rand() * nColumns);
      composition[i][column] = 1;
    }
  }

  return composition;
}

function buildCellDistribution(
  cellCount: number,
  lambda: number
): [number[], number[]] {
  const N: number[] = [];
  const D: number[] = [];
  let thisProbability: number = poisson(0, lambda);
  let thisCellCount: number = thisProbability * cellCount;
  N.push(Math.round(thisCellCount));
  D.push(thisProbability);
  let sumP: number = thisProbability;
  let k: number = 0;
  while (sumP < 0.999) {
    k++;
    thisProbability = poisson(k, lambda);
    thisCellCount = thisProbability * cellCount;
    sumP += thisProbability;
    D.push(thisProbability);
    N.push(Math.round(thisCellCount));
  }
  return [N, D];
}
function randomizeIntegers(n: number, rN: RandomNumber): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rN.rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}
