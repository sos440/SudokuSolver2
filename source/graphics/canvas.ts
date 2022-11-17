/**
 * @module canvas
 */

import { BaseN, MDIterator } from "../tools";


type Attributes = { [key: string]: any };


export class SVG {
    element: SVGElement;
    constructor(tag_name: string, attr?: Attributes) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', tag_name);
        return this.attr(attr);
    }

    html(html: string): this {
        this.element.innerHTML = html;
        return this;
    }

    attr(attr: Attributes = {}): this {
        for (const key in attr) {
            this.element.setAttribute(key, attr[key]);
        }
        return this;
    }

    addTo(parent: HTMLElement | SVGElement): this {
        parent.appendChild(this.element);
        return this;
    }

    g(attr?: Attributes): SVG {
        return new SVG('g').attr(attr).addTo(this.element);
    }

    rect(attr?: Attributes): SVG {
        return new SVG('rect').attr(attr).addTo(this.element);
    }

    circle(attr?: Attributes): SVG {
        return new SVG('circle').attr(attr).addTo(this.element);
    }

    ellipse(attr?: Attributes): SVG {
        return new SVG('ellipse').attr(attr).addTo(this.element);
    }

    line(attr?: Attributes): SVG {
        return new SVG('line').attr(attr).addTo(this.element);
    }

    polygon(attr?: Attributes): SVG {
        return new SVG('polygon').attr(attr).addTo(this.element);
    }

    polyline(attr?: Attributes): SVG {
        return new SVG('polyline').attr(attr).addTo(this.element);
    }

    path(attr?: Attributes): SVG {
        return new SVG('path').attr(attr).addTo(this.element);
    }

    text(text: string, attr?: Attributes): SVG {
        return new SVG('text').html(text).attr(attr).addTo(this.element);
    }
}


export class PuzzleCanvas {
    style: object;
    canvas: SVG;
    headerGroup: SVG;
    cellsGroup: SVG;
    marksGroup: SVG;
    cells: Map<number, SVG>;
    marks: Map<number, SVG>;
    constructor(options: Attributes = {}) {
        const o = PuzzleCanvas.computeStyle(options) as Attributes;
        const svg = new SVG('svg').attr({
            width: o['canvas-width'],
            height: o['canvas-height'],
            viewBox: `0 0 ${o['canvas-width']} ${o['canvas-height']}`
        });

        /** Background */
        svg.rect({ width: o['canvas-width'], height: o['canvas-height'] }).attr(o['background']);

        /** Header group */
        this.headerGroup = svg.g(o['header-font']);
        if (o['headers'] == 'display') {
            const c_hdr_size = 0.5 * (o['header-size'] + o['grid-padding']);
            for (const i of new Array(o['rows']).keys()) {
                const cell_xy = PuzzleCanvas.cellCenterXY(0, i, o);
                this.headerGroup.text(
                    o['header-row'].charAt(i),
                    { x: c_hdr_size, y: cell_xy[1] }
                );
            }
            for (const i of new Array(o['columns']).keys()) {
                const cell_xy = PuzzleCanvas.cellCenterXY(i, 0, o);
                this.headerGroup.text(
                    o['header-column'].charAt(i),
                    { x: cell_xy[0], y: c_hdr_size }
                );
            }
        }

        /** Cell groups */
        this.cellsGroup = svg.g({ fill: 'white' });
        this.cells = new Map<number, SVG>();
        for (const [x, y] of MDIterator([o['columns'], o['rows']])) {
            const cell_xy = PuzzleCanvas.cellXY(x, y, o);
            this.cells.set(
                x + o['columns'] * y,
                this.cellsGroup.rect({
                    x: cell_xy[0],
                    y: cell_xy[1],
                    width: o['cell-size'],
                    height: o['cell-size'],
                    rx: 4,
                    ry: 4
                })
            );
        }

        /** Mark group */
        this.marksGroup = svg.g();
        this.marks = new Map<number, SVG>();

        this.style = o;
        this.canvas = svg;
    }

    static computeStyle(o: Attributes = {}) {
        o = Object.assign(Object.assign({}, PuzzleCanvas.options), o);

        if (o['rows'] != o['header-row'].length) {
            throw RangeError(`The length of the row header does not match the number of rows.`);
        }
        else if (o['columns'] != o['header-column'].length) {
            throw RangeError(`The length of the column header does not match the number of columns.`);
        }

        const Dp = o['dimension'];
        o['cell-size'] = Dp * o['mark-size'] + (Dp - 1) * o['cell-inner-sep'] + 2 * o['cell-padding'];
        o['box-size'] = Dp * o['cell-size'] + (Dp - 1) * o['box-inner-sep'] + 2 * o['box-padding'];

        const cell_p = [o['columns'], o['rows']];
        const box_p = cell_p.map((v) => Math.ceil(v / Dp));
        const grid_wh = cell_p.map((_, i) => (
            cell_p[i] * o['cell-size']
            + (cell_p[i] - box_p[i]) * o['box-inner-sep']
            + 2 * box_p[i] * o['box-padding']
            + (box_p[i] - 1) * o['grid-inner-sep']
            + 2 * o['grid-padding']
        ));
        o['grid-width'] = grid_wh[0];
        o['grid-height'] = grid_wh[1];

        o['canvas-width'] = o['grid-width'] + (o['headers'] == 'display' ? o['header-size'] : 0);
        o['canvas-height'] = o['grid-height'] + (o['headers'] == 'display' ? o['header-size'] : 0);

        console.log(o);

        return o;
    }

    /** Computes the left-top position of the cell. */
    static cellXY(x: number, y: number, o: Attributes): number[] {
        if (!('cell-size' in o)) {
            throw TypeError(`The property 'cell-size' has not been computed yet.`);
        }
        const Dp = o['dimension'];
        const idx = [x, y];
        const box_idx = idx.map((v) => Math.trunc(v / Dp));

        return idx.map((_, i) => {
            return (
                (o['headers'] == 'display' ? o['header-size'] : 0)
                + box_idx[i] * o['grid-inner-sep']
                + o['grid-padding']
                + (idx[i] - box_idx[i]) * o['box-inner-sep']
                + (2 * box_idx[i] + 1) * o['box-padding']
                + idx[i] * o['cell-size']
            );
        });
    }

    /** Computes the center of the cell. */
    static cellCenterXY(x: number, y: number, o: Attributes): number[] {
        if (!('cell-size' in o)) {
            throw TypeError(`The property 'cell-size' has not been computed yet.`);
        }
        return PuzzleCanvas.cellXY(x, y, o).map((v: number) => v + 0.5 * o['cell-size']);
    }

    /** Computes the left-top position of the cell. */
    static markXY(x: number, y: number, key: number, o: Attributes): number[] {
        if (!('cell-size' in o)) {
            throw TypeError(`The property 'cell-size' has not been computed yet.`);
        }
        const Dp = o['dimension'];
        const pos = [x, y];
        const cell_xy = PuzzleCanvas.cellXY(x, y, o);
        const mark_idx = [key % Dp, Math.trunc(key / Dp)];

        return pos.map((_, i) => {
            return (cell_xy[i] + mark_idx[i] * (o['cell-inner_sep'] + o['cell-size']));
        });
    }

    /** Computes the left-top position of the cell. */
    static markCenterXY(x: number, y: number, key: number, o: Attributes): number[] {
        return PuzzleCanvas.markXY(x, y, key, o).map((v) => v + 0.5 * o['mark-size']);
    }

    static options = {
        'rows': 9,
        'columns': 9,
        'dimension': 3,

        'mark-size': 14,
        'cell-inner-sep': 1,
        'cell-padding': 1,
        'box-inner-sep': 1,
        'box-padding': 0,
        'grid-inner-sep': 3,
        'grid-padding': 4,
        'headers': 'display', /** display | none */
        'header-size': 12,
        'header-row': 'ABCDEFGHJ',
        'header-column': '123456789',

        'background': {
            fill: 'black'
        },
        'header-font': {
            'font-family': 'Helvetica',
            'font-size': 10,
            fill: 'white',
            'text-anchor': 'middle',
            'dominant-baseline': 'middle'
        },
        'mark-font': {
            'font-family': 'Helvetica',
            'font-size': 9,
            fill: 'white',
            'text-anchor': 'middle',
            'dominant-baseline': 'middle'
        },
        'cell-font': {
            'font-family': 'Helvetica',
            'font-size': 30,
            fill: 'white',
            'text-anchor': 'middle',
            'dominant-baseline': 'middle'
        },
    }
}