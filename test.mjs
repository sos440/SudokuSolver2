import * as Tools from './tools.mjs';
import * as Sudoku from './game_basic.mjs';

/** Test the range generator. */
for (const i of Tools.range(10)){
    console.log(i);
}

/** Test the object */
let o = new Sudoku.Puzzle();
o.setStateAt(1, 3, 7, Sudoku.State.OCCUPIED);
console.log(`state: ${o.getStateAt(1, 3, 7)}`);

let o2 = Sudoku.Puzzle.copy(o);
o2.setStateAt(1, 3, 7, Sudoku.State.VACANT);
console.log(`1st puzzle's state: ${o.getStateAt(1, 3, 7)}`);
console.log(`2nd puzzle's state: ${o2.getStateAt(1, 3, 7)}`);
