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
        const msg_conn = Strategies.computeConnectivity(new PuzzleMessage({ puzzle: source }));
        msg_conn.K_in_RC.forEach((arr_keys, grid) => {
            /* Draw the cell face. */
            const param_pos = Puzzle.numberToD1Pair(grid);
            const pos_box = param_pos.map(v => cs['grid-border-width'] + Math.trunc(v / Dp) * (Dp * cs['cell-size'] + (Dp - 1) * cs['cell-border-width'] + cs['box-border-width']));
            const pos_cell = param_pos.map((v, i) => pos_box[i] + (v % Dp) * (cs['cell-size'] + cs['cell-border-width']));
            draw.rect(cs['cell-size'], cs['cell-size']).attr({
                fill: 'white',
                x: pos_cell[1], /** Note that rows are juxtaposed vertically. */
                y: pos_cell[0], /** Note that columns are juxtaposed horizontally. */
                rx: 3,
                ry: 3
            });

            if (arr_keys.length == D1) {
                /** If no pencilmarks are vacant, render nothing. */
            }
            else if (arr_keys.length == 1) {
                /** 
                 * If there is a unique pencilmark in the cell, make it a determined value.
                 * @todo This is only a temporary feature.
                 * Later, improving each unique pencilmark to a determined value will become 
                 * part of solving strategy.
                 */
                const pos_value = pos_cell.map(v => v + 1.5 * cs['mark-size'] + cs['mark-border-width']);
                draw.text(`${cs['mark-symbols'][arr_keys[0]]}`).font(cs['cell-font']).attr({
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    x: pos_value[1],
                    y: pos_value[0]
                });
            }
            else if (arr_keys.length == 0) {
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
                arr_keys.forEach(key => {
                    const param_pos2 = [Math.trunc(key / Dp), key % Dp];
                    const pos_mark = param_pos2.map((v, i) => pos_cell[i] + 0.5 * cs['mark-size'] + v * (cs['mark-size'] + cs['mark-border-width']));
                    draw.text(`${cs['mark-symbols'][key]}`).font(cs['mark-font']).attr({
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
        'mark-symbols': Array.from({ length: D1 }).map((_, key) => String.fromCharCode('1'.charCodeAt(0) + key))
    };
}


/**
 * Test
 */

const o = Puzzle.importFromString('107900025000007006300208100010000080805704603030000010001309000500000009690002070');

SVG.on(document, 'DOMContentLoaded', function () {
    let gp = new PuzzleGraphics();
    let msg = new PuzzleMessage({ puzzle: o });

    /**
     * @todo Want to improve this in a more functional fashion.
     */
    while (true) {
        gp.renderSVG(msg.puzzle).addTo('body');
        do {
            msg = Strategies.nakedSingle(msg);
            if (msg.isUpdated) {
                break;
            }
            msg = Strategies.hiddneSingle(msg);
            if (msg.isUpdated) {
                break;
            }
        } while (false)

        if (!msg.isUpdated) {
            break;
        }
        for (const [index, msg_list] of Object.entries(msg?.messages ?? {})) {
            let msg_node = document.createElement('p');
            msg_node.innerText = msg_str;
            document.body.appendChild(msg_node);
        }
    }
});



/**
 * @todo Design a standalone notation for 'annotated sudoku puzzle' (sudoku data + annotations) and implement it.
 * @todo Design a fast and easy-to-use notation for addressing sudoku puzzle.
 */