/**
 * @todo Refactor this so that it makes use of the information from GameSpecItem.
 * (For example, use the text-based grid template to draw the actual field.)
 * 
 * @todo Consider using canvas object instead.
 */

import { GameSpecItem } from "../spec/spec";

/** Represents a puzzle augmented with annotations. */
export interface PuzzleCanvasSnapshot {
    type?: string;
    rest?: Set<number>;
    given?: Set<number>;
    found?: Set<number>;
    pencilmarked?: Set<number>;
    annotations?: string[];
}


export type Attributes = { [key: string]: any };


/**
 * A simple SVG container for method chaining style.
 */
export class SVG {
    element: SVGElement;
    constructor(tag_name: string, attr?: Attributes) {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', tag_name);
        if (tag_name == 'svg') {
            this.attr({
                'xmlns': 'http://www.w3.org/2000/svg',
                'xmlns:xlink': 'http://www.w3.org/1999/xlink'
            })
        }
        return this.attr(attr);
    }

    html(html: string): this {
        this.element.innerHTML = html;
        return this;
    }

    attr(attr: Attributes = {}): this {
        for (const key in attr) {
            if (typeof attr[key] == 'undefined' || attr[key] == null) {
                this.element.removeAttribute(key);
            }
            else {
                this.element.setAttribute(key, attr[key]);
            }
        }
        return this;
    }

    addTo(parent: HTMLElement | SVGElement | SVG): this {
        if (parent instanceof SVG) {
            parent = parent.element;
        }
        if (!parent.contains(this.element)) {
            parent.appendChild(this.element);
        }
        return this;
    }

    remove(child: HTMLElement | SVGElement | SVG): this {
        if (child instanceof SVG) {
            child = child.element;
        }
        if (this.element.contains(child)) {
            this.element.removeChild(child);
        }
        return this;
    }

    use(id: string, attr?: Attributes): SVG {
        return new SVG('use').attr({ 'href': id }).attr(attr).addTo(this.element);
    }

    g(attr?: Attributes): SVG {
        return new SVG('g').attr(attr).addTo(this.element);
    }

    defs(attr?: Attributes): SVG {
        return new SVG('defs').attr(attr).addTo(this.element);
    }

    symbol(attr?: Attributes): SVG {
        return new SVG('symbol').attr(attr).addTo(this.element);
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


/**
 * A container for a family of text-in-boxes.
 */
class SVGGroup {
    elements: Map<number, SVG>;
    group: SVG;
    constructor(group: SVG) {
        this.group = group;
        this.elements = new Map<number, SVG>();
    }

    get(key: number) {
        return this.elements.get(key);
    }

    set(key: number, elem: SVG) {
        this.elements.set(key, elem);
        this;
    }

    show(key: number) {
        if (!this.elements.has(key)) { return; }
        const elem = this.elements.get(key) as SVG;
        return elem.addTo(this.group);
    }

    hide(key: number) {
        if (!this.elements.has(key)) { return; }
        const elem = this.elements.get(key) as SVG;
        this.group.remove(elem.element);
        return elem;
    }

    showAll() {
        this.elements.forEach(elem => elem.addTo(this.group));
        return this;
    }

    hideAll() {
        this.elements.forEach(elem => this.group.remove(elem));
        return this;
    }

    clearStyle(arg: number | SVG) {
        const elem = (arg instanceof SVG) ? arg : this.elements.get(arg);
        const attr_remove = ['fill', 'stroke', 'stroke-width'];
        if (typeof elem == 'undefined') { return; }
        for (const attr of attr_remove) {
            elem.element.removeAttribute(attr);
        }
        return elem;
    }

    clearAll() {
        this.elements.forEach(elem => this.clearStyle(elem));
        return this;
    }
}


export class PuzzleCanvas extends SVG {
    style: Attributes;
    headerGroup: SVG;
    cellRects: SVGGroup;
    cellTexts: SVGGroup;
    markRects: SVGGroup;
    markTexts: SVGGroup;
    drawing: SVG;
    constructor(game_spec: GameSpecItem, options: Attributes = {}) {
        super('svg');
        options.rows = game_spec.height;
        options.cols = game_spec.width;
        const o = PuzzleCanvas.computeStyle(options) as Attributes;

        /** Basic styles. */
        this.attr({
            width: o['canvas-width'],
            height: o['canvas-height'],
            viewBox: `0 0 ${o['canvas-width']} ${o['canvas-height']}`,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle'
        });

        const rows = o['rows'];
        const cols = o['columns'];
        const Dp = o['dimension'];
        const D1 = Dp ** 2;

        /** Background */
        this.rect({ id: 'bg', width: o['canvas-width'], height: o['canvas-height'] }).attr(o['background']);

        /** Header group */
        this.headerGroup = this.g({ id: 'header' }).attr(o['header-font']);
        if (o['headers'] == 'display') {
            const c_hdr_size = 0.5 * (o['header-size'] + o['grid-padding']);
            for (const i of new Array(rows).keys()) {
                const cell_xy = PuzzleCanvas.cellCenterXY(0, i, o);
                this.headerGroup.text(
                    game_spec.rowCharMap[i],
                    { x: c_hdr_size, y: cell_xy[1] }
                );
            }
            for (const i of new Array(cols).keys()) {
                const cell_xy = PuzzleCanvas.cellCenterXY(i, 0, o);
                this.headerGroup.text(
                    game_spec.colCharMap[i],
                    { x: cell_xy[0], y: c_hdr_size }
                );
            }
        }

        /** Generates a cell group. */
        const cell_dw = o['cell-size'];
        this.cellRects = new SVGGroup(this.g({ id: 'cell_rect', fill: 'white' }));
        this.cellTexts = new SVGGroup(this.g({ id: 'cell_text' }).attr(o['cell-font']));
        for (const x of new Array(rows).keys()) {
            for (const y of new Array(cols).keys()) {
                const index = y * cols + x;
                const pos = PuzzleCanvas.cellXY(x, y, o);
                this.cellRects.set(
                    index,
                    new SVG('rect', { x: pos[0], y: pos[1], width: cell_dw, height: cell_dw, rx: 4, ry: 4 })
                );
                this.cellTexts.set(
                    index,
                    new SVG('text', { x: pos[0] + 0.5 * cell_dw, y: pos[1] + 0.5 * cell_dw })
                );
            }
        }

        /** Generates a mark group. */
        const mark_dw = o['mark-size'];
        this.markRects = new SVGGroup(this.g({ id: 'mark_rect' }));
        this.markTexts = new SVGGroup(this.g({ id: 'mark_text' }).attr(o['mark-font']));
        for (const x of new Array(rows).keys()) {
            for (const y of new Array(cols).keys()) {
                for (const num of new Array(D1).keys()) {
                    const index = (y * cols + x) * D1 + num;
                    const pos = PuzzleCanvas.markXY(x, y, num, o);
                    this.markRects.set(
                        index,
                        new SVG('rect', { x: pos[0], y: pos[1], width: mark_dw, height: mark_dw, rx: 4, ry: 4 })
                    );
                    this.markTexts.set(
                        index,
                        new SVG('text')
                            .html(`${game_spec.numCharMap[num]}`)
                            .attr({ x: pos[0] + 0.5 * mark_dw, y: pos[1] + 0.5 * mark_dw })
                    );
                }
            }
        }

        this.drawing = this.g({ id: 'drawing' });

        /** Finalize */
        this.cellRects.showAll();
        this.style = o;
    }

    /** Returns a computed style. */
    static computeStyle(o: Attributes = {}) {
        o = Object.assign(Object.assign({}, PuzzleCanvas.options), o);

        if (o['rows'] > o['header-row-symbols'].length) {
            throw RangeError(`The length of the row header does not match the number of rows.`);
        }
        else if (o['columns'] > o['header-column-symbols'].length) {
            throw RangeError(`The length of the column header does not match the number of columns.`);
        }
        else if (o['dimension'] ** 2 > o['mark-symbols'].length) {
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
            return (cell_xy[i] + mark_idx[i] * (o['cell-inner-sep'] + o['mark-size']) + o['cell-inner-sep']);
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
        'mark-symbols': '123456789',

        'cell-inner-sep': 1,
        'cell-padding': 1,

        'box-inner-sep': 1,
        'box-padding': 0,

        'grid-inner-sep': 3,
        'grid-padding': 4,

        'headers': 'display', /** display | none */
        'header-size': 12,
        'header-row-symbols': 'ABCDEFGHJ',
        'header-column-symbols': '123456789',

        'background': {
            fill: 'black',
            rx: 4,
            ry: 4
        },
        'header-font': {
            'font-family': 'Helvetica',
            'font-size': 10,
            fill: 'white'
        },
        'mark-font': {
            'font-family': 'Helvetica',
            'font-size': 9,
            fill: 'black'
        },
        'cell-font': {
            'font-family': 'Helvetica',
            'font-size': 30,
            fill: 'black'
        },

        'rect:removed': {
            'fill': 'yellow',
            'stroke': 'pink',
            'stroke-width': 0.75
        },
        'rect:determined': {
            'fill': 'hsl(216, 80%, 85%)',
            'stroke': 'hsl(216, 50%, 25%)',
            'stroke-width': 0.75
        },
        'rect:based': {
            'fill': 'hsl(142, 90%, 85%)',
            'stroke': 'hsl(142, 50%, 25%)',
            'stroke-width': 0.75
        },
        'rect:affected': {
            'fill': 'hsl(350, 80%, 90%)',
            'stroke': 'hsl(350, 50%, 25%)',
            'stroke-width': 0.75
        },
        'rect:intersect': {
            'fill': 'hsl(200, 60%, 67%)',
            'stroke': 'hsl(200, 30%, 25%)',
            'stroke-width': 0.75
        },

        'text:removed': {
            'fill': 'red'
        },
        'text:determined': {
            'fill': 'blue'
        },
        'text:intersect': {},
        'text:based': {},
        'text:affected': {},
    }
}