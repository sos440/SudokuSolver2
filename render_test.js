/** @requires SVG.js package */

class PuzzleGraphics {
    constructor(style = {}) {
        this.style = Object.assign(style, PuzzleGraphics.style);
    }

    /**
     * 
     * @param {Puzzle} source  
     */
    renderSVG(source) {
        /** Computed styles. */
        let cs = Object.assign({}, this.style);
        cs['cell-size'] = 3 * cs['mark-size'] + 2 * cs['mark-border-width'];
        cs['box-size'] = 3 * cs['cell-size'] + 2 * cs['cell-border-width'];
        cs['grid-size'] = 3 * cs['box-size'] + 2 * cs['box-border-width'];
        cs['image-size'] = cs['grid-size'] + 2 * cs['grid-border-width'];

        /** Rendered SVG wrapper. */
        let draw = SVG().size(cs['image-size'], cs['image-size']);

        /** Render the background. */
        draw.rect(cs['image-size'], cs['image-size']).attr({
            fill: 'black'
        });

        /** Render cells and pencilmarks. */
        const conn = PuzzleConnectivity.compute(source);
        conn.rc.forEach((cur_lu, grid) => {
            /* Draw the cell face. */
            const param_pos = [Math.trunc(grid / D1), grid % D1];
            const pos_box = param_pos.map(v => cs['grid-border-width'] + Math.trunc(v / Dp) * (Dp * cs['cell-size'] + (Dp - 1) * cs['cell-border-width'] + cs['box-border-width']));
            const pos_cell = param_pos.map((v, i) => pos_box[i] + (v % Dp) * (cs['cell-size'] + cs['cell-border-width']));
            draw.rect(cs['cell-size'], cs['cell-size']).attr({
                fill: 'white',
                x: pos_cell[1], /** Note that rows are juxtaposed vertically. */
                y: pos_cell[0], /** Note that columns are juxtaposed horizontally. */
                rx: 3,
                ry: 3
            });

            if (cur_lu.length == D1) {
                /** If no pencilmarks are vacant, render nothing. */
            }
            else if (cur_lu.length == 1) {
                /** 
                 * If there is a unique pencilmark in the cell, make it a determined value.
                 * @todo This is only a temporary feature.
                 * Later, improving each unique pencilmark to a determined value will become 
                 * part of solving strategy.
                 */
                const pos_value = pos_cell.map(v => v + 1.5 * cs['mark-size'] + cs['mark-border-width']);
                draw.text(cs['mark-symbols'].charAt(cur_lu[0].key)).font(cs['cell-font']).attr({
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    x: pos_value[1],
                    y: pos_value[0]
                });
            }
            else if (cur_lu.length == 0) {
                /** 
                 * If there are no pencilmarks in the cell, draw an X mark.
                 * @todo This is only a temporary feature.
                 */
                const pos_value = pos_cell.map(v => v + 1.5 * cs['mark-size'] + cs['mark-border-width']);
                draw.text('X').font(cs['cell-font:invalid']).attr({
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    x: pos_value[1],
                    y: pos_value[0]
                });
            }
            else {
                /**
                 * If there are multiple (but not a whole set of) pencilmarks, draw them.
                 */
                cur_lu.forEach(addr => {
                    const key = addr.key;
                    const param_pos2 = [Math.trunc(key / Dp), key % Dp];
                    const pos_mark = param_pos2.map((v, i) => pos_cell[i] + 0.5 * cs['mark-size'] + v * (cs['mark-size'] + cs['mark-border-width']));
                    draw.text(cs['mark-symbols'].charAt(key)).font(cs['mark-font']).attr({
                        'text-anchor': 'middle',
                        'dominant-baseline': 'middle',
                        x: pos_mark[1],
                        y: pos_mark[0]
                    });
                });
            }
        });
        return draw;
    }

    static style = {
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
        'mark-size': 14,
        'mark-border-width': 1,
        'cell-border-width': 1,
        'box-border-width': 2,
        'grid-border-width': 4,
        'mark-symbols': '123456789'
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

        if (msg.isUpdated){
            gp_render_puzzle(msg);
        }
        gp_render_msg(msg);
    });

    /** Prev button. */
    document.querySelector('#move_prev').addEventListener('click', e => {
        o_log.replaceChildren();
        if (cur_page == 0) {
            o_log.appendChild(document.createTextNode('This is the initial puzzle.'));
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