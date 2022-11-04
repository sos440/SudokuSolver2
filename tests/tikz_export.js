const Dp = 3;
const D1 = Dp ** 2;
const D2 = D1 ** 2;
const D3 = D1 ** 3;

class PuzzleGraphics {
    constructor(style = {}) {
        this.style = Object.assign(style, PuzzleGraphics.style);
    }

    /**
     * compute the position of the cell region.
     * @param {number} row The row.
     * @param {number} col The column.
     * @param {object} cs The object containing computed styles.
     * @returns {number[]} The computed [x, y] position.
     */
    static pos_cell(row, col, cs) {
        const coord = [col, row];
        const n_box_seps = coord.map(v => Math.floor(v / Dp));
        const n_cell_seps = coord.map((v, i) => v - n_box_seps[i]);
        return coord.map((v, i) => cs['grid-border-width']
            + v * cs['cell-size']
            + n_cell_seps[i] * cs['cell-border-width']
            + n_box_seps[i] * cs['box-border-width']
        );
    }

    /**
     * compute the position of the cell text.
     * @param {number} row The row.
     * @param {number} col The column.
     * @param {object} cs The object containing computed styles.
     * @returns {number[]} The computed [x, y] position.
     */
    static pos_cell_text(row, col, cs) {
        return PuzzleGraphics.pos_cell(row, col, cs).map(v => v + 0.5 * cs['cell-size']);
    }

    /**
     * compute the position of the pencilmark region.
     * @param {number} row The row.
     * @param {number} col The column.
     * @param {number} key The key.
     * @param {object} cs The object containing computed styles.
     * @returns {number[]} The computed [x, y] position.
     */
    static pos_mark(row, col, key, cs) {
        const pos = PuzzleGraphics.pos_cell(row, col, cs);
        const coord = [key % Dp, Math.trunc(key / Dp)];
        return pos.map((v, i) => v + coord[i] * (cs['mark-size'] + cs['mark-border-width']));
    }

    /**
     * compute the position of the pencilmark text.
     * @param {number} row The row.
     * @param {number} col The column.
     * @param {number} key The key.
     * @param {object} cs The object containing computed styles.
     * @returns {number[]} The computed [x, y] position.
     */
    static pos_mark_text(row, col, key, cs) {
        return PuzzleGraphics.pos_mark(row, col, key, cs).map(v => v + 0.5 * cs['mark-size']);
    }

    computeStyle() {
        let cs = Object.assign({}, this.style);
        cs['cell-size'] = 3 * cs['mark-size'] + 2 * cs['mark-border-width'];
        cs['box-size'] = 3 * cs['cell-size'] + 2 * cs['cell-border-width'];

        const num_col_box_seps = Math.ceil(cs['columns'] / Dp) - 1;
        const num_col_cell_seps = cs['columns'] - 1 - num_col_box_seps;
        cs['grid-width'] = cs['columns'] * cs['cell-size']
            + num_col_cell_seps * cs['cell-border-width']
            + num_col_box_seps * cs['box-border-width'];
        cs['image-width'] = cs['grid-width'] + 2 * cs['grid-border-width'];

        const num_row_box_seps = Math.ceil(cs['rows'] / Dp) - 1;
        const num_row_cell_seps = cs['rows'] - 1 - num_row_box_seps;
        cs['grid-height'] = cs['rows'] * cs['cell-size']
            + num_row_cell_seps * cs['cell-border-width']
            + num_row_box_seps * cs['box-border-width'];
        cs['image-height'] = cs['grid-height'] + 2 * cs['grid-border-width'];

        return cs;
    }

    static style = {
        'rows': D1,
        'columns': D1,
        'mark-font': {
            family: 'Helvetica',
            size: 9,
            fill: "black"
        },
        'cell-font': {
            family: 'Helvetica',
            size: 30,
            fill: "black"
        },
        'cell-font:invalid': {
            family: 'Helvetica',
            size: 30,
            fill: "red",
            weight: "bold"
        },
        'mark-symbols': '123456789',
        'mark-size': 14,
        'mark-border-width': 1,
        'cell-border-width': 1,
        'box-border-width': 2,
        'grid-border-width': 4,
    };
}