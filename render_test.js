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
        const conn = Puzzle.computeConnectivity(source);
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
    let gp = new PuzzleGraphics();
    gp.renderSVG(cur_puzzle).addTo(o_disp);

    let msg = new StrategyMessage({ puzzle: cur_puzzle });
    document.querySelector('#move_next').addEventListener('click', e => {
        o_log.replaceChildren();

        /** Test the strategies sequentially. */
        (_ => {
            const conn = msg.getConnectivity();
            msg = Strategies.nakedSingle(msg);
            if (msg.isUpdated) {
                return;
            }

            msg.conn = conn;
            msg = Strategies.hiddneSingle(msg);
            if (msg.isUpdated) {
                return;
            }

            return;
        })();

        /** Log and exit when there are no updates. */
        if (!msg.isUpdated) {
            o_log.appendChild(document.createTextNode('No updates!'));
            return;
        }

        /** Redraw the puzzle. */
        o_disp.replaceChildren();
        gp.renderSVG(msg.puzzle).addTo(o_disp);

        /** Make logs. */
        for (const [key, msg_list] of Object.entries(msg.groupedMsgs)) {
            let msg_node = document.createElement('p');
            msg_node.appendChild(document.createTextNode(`${msg_list[0]?.addr_weak} unmarked by ${msg.type}: `));
            msg_node.appendChild(document.createTextNode(msg_list.map(o => `${o.addr_strong} in ${o.type_strong} => ${o.type_weak}`).join(', ')));
            o_log.appendChild(msg_node);
        }
    });
});



/**
 * @todo Design a standalone notation for 'annotated sudoku puzzle' (sudoku data + annotations) and implement it. Perhaps we can use shadowDOM?
 * @todo Design a fast and easy-to-use notation for addressing sudoku puzzle.
 */