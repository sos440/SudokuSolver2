/**
 * A module for the graph structure of the original sudoku game.
 */
import { Edge, Vertex } from './adj';
import { CellIndex, GameSpecItem } from '../spec/spec';

export type RawPuzzle = {
    type: string;
    given: Set<CellIndex>;
    found: Set<CellIndex>;
    rest: Set<CellIndex>;
};

export class Puzzle extends Edge {
    constructor(game_spec: GameSpecItem, pz_raw: RawPuzzle) {
        if (game_spec.type != pz_raw.type) {
            throw TypeError(`The type '${pz_raw.type}' is not admissible for this class.`);
        }
        super(game_spec.type);

        /** Create house-based edges. */
        for (let num = 0; num < game_spec.size; num++) {
            for (const house of game_spec.houses.values()) {
                this.grab(new Edge(`${house.id}n${num + 1}`, '.rule'));
            }
        }

        /** Create vertices and cell-based edges. */
        for (const cell of game_spec.cells.values()) {
            this.grab(new Edge(`${cell.id}`, '.rule', { index: cell.index }));

            for (let num = 0; num < game_spec.size; num++) {
                /** Creates the vertex. */
                const index = cell.index * game_spec.size + num;
                const v = new Vertex(
                    `${cell.id}n${num + 1}`,
                    '',
                    { index: index, row: cell.row, col: cell.col, num: num }
                );
                
                if (pz_raw.rest.has(index)) { v.className = '.rest' }
                else if (pz_raw.given.has(index)) { v.className = '.given'; }
                else if (pz_raw.found.has(index)) { v.className = '.found'; }
                else { continue; }

                this.grab(v);
                this.v.add(v);

                /** Link the vertex to the adjacent edges. */
                v.link(this.adj.get(`e.rule #{${cell.id}}`) as Edge);
                for (const house_id of cell.houses) {
                    v.link(this.adj.get(`e.rule #{${house_id}n${num + 1}}`) as Edge);
                }
            }
        }
    }
}