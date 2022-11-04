/** @requires SVG.js package */

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

    /** 
     * Render the puzzle as SVG.
     * @todo This is only a temporary feature.
     * @param {Puzzle} source The puzzle to render.
     * @returns {SVG.Svg} A SVG wrapper representing the rendered puzzle.
     */
    renderSVG(source) {
        /** Computed styles. */
        const cs = this.computeStyle();

        /** Rendered SVG wrapper. */
        const draw = SVG().size(cs['image-width'], cs['image-height']);

        /** Render the background. */
        draw.rect(cs['image-width'], cs['image-height']).attr({
            fill: 'black'
        });

        /** Render cells and pencilmarks. */
        const conn = PuzzleConnectivity.compute(source);
        conn.rc.forEach((cur_lu, grid) => {
            /* Draw the cell face. */
            const row = Math.trunc(grid / D1);
            const col = grid % D1;
            const pos = PuzzleGraphics.pos_cell(row, col, cs);
            draw.rect(cs['cell-size'], cs['cell-size'])
                .attr({ x: pos[0], y: pos[1], rx: 3, ry: 3, fill: 'white' });

            if (cur_lu.length == D1) {
                /** If no pencilmarks are vacant, render nothing. */
            }
            else if (cur_lu.length == 1) {
                /** If there is a unique pencilmark, draw it big. */
                const pos_t = PuzzleGraphics.pos_cell_text(row, col, cs);
                draw.text(cs['mark-symbols'].charAt(cur_lu[0].key))
                    .font(cs['cell-font'])
                    .attr({ x: pos_t[0], y: pos_t[1], 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
            }
            else if (cur_lu.length == 0) {
                /** If there are no pencilmarks, draw an X. */
                const pos_t = PuzzleGraphics.pos_cell_text(row, col, cs);
                draw.text('X')
                    .font(cs['cell-font:invalid'])
                    .attr({ x: pos_t[0], y: pos_t[1], 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
            }
            else {
                /** If there are multiple (but not a whole set of) pencilmarks, draw them. */
                cur_lu.forEach(addr => {
                    const key = addr.key;
                    const pos_mt = PuzzleGraphics.pos_mark_text(row, col, key, cs);
                    draw.text(cs['mark-symbols'].charAt(key))
                        .font(cs['mark-font'])
                        .attr({ x: pos_mt[0], y: pos_mt[1], 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
                });
            }
        });
        return draw;
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


/**
 * TEST
 * The code below is only for a test purpose
 * @todo Want to improve this in a more functional fashion.
 */

SVG.on(document, 'DOMContentLoaded', function () {
    const o_disp = document.querySelector('#display');
    const o_log = document.querySelector('#log');

    const cur_puzzle = Puzzle.importFromString('107900025000007006300208100010000080805704603030000010001309000500000009690002070');

    /** Initialize the graphics wrapper. */
    const gp = new PuzzleGraphics();

    /**
     * Display the puzzle.
     * @param {PuzzleMessage} msg The current message to display. 
     */
    const gp_render_puzzle = (msg) => {
        o_disp.replaceChildren();
        gp.renderSVG(msg.puzzle).addTo(o_disp);
    }

    /**
     * Display the message logs.
     * @param {PuzzleMessage} msg The current message to display. 
     */
    const gp_render_msg = (msg) => {
        for (const [key, msg_list] of Object.entries(msg.groupedMsgs)) {
            let msg_node = document.createElement('p');
            msg_node.appendChild(document.createTextNode(`${msg_list[0]?.addr_weak} unmarked by ${msg.type}: `));
            msg_node.appendChild(document.createTextNode(msg_list.map(o => `${o.addr_strong} in S{${o.type_strong}} => W{${o.type_weak}}`).join(', ')));
            o_log.appendChild(msg_node);
        }
    }

    /** History navigation. */
    const arr_history = [new StrategyMessage({ puzzle: cur_puzzle })];
    let cur_page = 0;

    /** Initial display. */
    gp_render_puzzle(arr_history[0]);

    /** Next button. */
    document.querySelector('#move_next').addEventListener('click', e => {
        o_log.replaceChildren();
        cur_page++;

        /** Test the strategies sequentially. */
        const msg = (_ => {
            if (cur_page == arr_history.length) {
                console.log(`Computation ${cur_page}.`);

                let msg = new StrategyMessage(arr_history.at(-1));
                const conn = PuzzleConnectivity.compute(msg.puzzle);

                for (const strategy of [
                    Strategies.nakedSingle,
                    Strategies.hiddneSingle
                ]) {
                    msg.conn = conn;
                    msg = strategy(msg);
                    if (msg.isUpdated) {
                        arr_history.push(msg);
                        return msg;
                    }
                }
                /** If no updates, then revert the increment. */
                cur_page--;
                o_log.appendChild(document.createTextNode('Strategies found no improvements.'));
            }
            /** ...and return the last puzzle. */
            return arr_history[cur_page];
        })();

        if (msg.isUpdated) {
            gp_render_puzzle(msg);
        }
        gp_render_msg(msg);
    });

    /** Prev button. */
    document.querySelector('#move_prev').addEventListener('click', e => {
        o_log.replaceChildren();
        if (cur_page == 0) {
            o_log.appendChild(document.createTextNode('This is already the initial puzzle. You cannot go further back.'));
            return;
        }
        else {
            cur_page--;
            const msg = arr_history[cur_page];
            gp_render_puzzle(msg);
            gp_render_msg(msg);
        }
    });
});



/**
 * @todo Design a standalone notation for 'annotated sudoku puzzle' (sudoku data + annotations) and implement it. Perhaps we can use shadowDOM?
 * @todo Design a fast and easy-to-use notation for addressing sudoku puzzle.
 */