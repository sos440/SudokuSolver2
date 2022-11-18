(()=>{"use strict";var e={963:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.PuzzleCanvas=t.SVG=void 0;const n=s(466);class r{constructor(e,t){return this.element=document.createElementNS("http://www.w3.org/2000/svg",e),this.attr(t)}html(e){return this.element.innerHTML=e,this}attr(e={}){for(const t in e)void 0===e[t]||null==e[t]?this.element.removeAttribute(t):this.element.setAttribute(t,e[t]);return this}addTo(e){return e instanceof r&&(e=e.element),e.contains(this.element)||e.appendChild(this.element),this}remove(e){return e instanceof r&&(e=e.element),this.element.contains(e)&&this.element.removeChild(e),this}use(e,t){return new r("use").attr({href:e}).attr(t).addTo(this.element)}g(e){return new r("g").attr(e).addTo(this.element)}defs(e){return new r("defs").attr(e).addTo(this.element)}symbol(e){return new r("symbol").attr(e).addTo(this.element)}rect(e){return new r("rect").attr(e).addTo(this.element)}circle(e){return new r("circle").attr(e).addTo(this.element)}ellipse(e){return new r("ellipse").attr(e).addTo(this.element)}line(e){return new r("line").attr(e).addTo(this.element)}polygon(e){return new r("polygon").attr(e).addTo(this.element)}polyline(e){return new r("polyline").attr(e).addTo(this.element)}path(e){return new r("path").attr(e).addTo(this.element)}text(e,t){return new r("text").html(e).attr(t).addTo(this.element)}}t.SVG=r;class i{constructor(e){this.group=e,this.elements=new Map}get(e){return this.elements.get(e)}set(e,t){this.elements.set(e,t)}show(e){if(this.elements.has(e))return this.elements.get(e).addTo(this.group)}hide(e){if(!this.elements.has(e))return;const t=this.elements.get(e);return this.group.remove(t.element),t}showAll(){return this.elements.map(((e,t)=>t.addTo(this.group))),this}hideAll(){return this.elements.map(((e,t)=>this.group.remove(t))),this}clearStyle(e){const t=e instanceof r?e:this.elements.get(e),s=["fill","stroke","stroke-width"];if(void 0!==t){for(const e of s)t.element.removeAttribute(e);return t}}clearAll(){return this.elements.map(((e,t)=>this.clearStyle(t))),this}}class o extends r{constructor(e={}){super("svg");const t=o.computeStyle(e);this.attr({width:t["canvas-width"],height:t["canvas-height"],viewBox:`0 0 ${t["canvas-width"]} ${t["canvas-height"]}`,"text-anchor":"middle","dominant-baseline":"middle"});const s=t.rows,a=t.columns,l=t.dimension,h=Math.pow(l,2);if(this.rect({id:"bg",width:t["canvas-width"],height:t["canvas-height"]}).attr(t.background),this.headerGroup=this.g({id:"header"}).attr(t["header-font"]),"display"==t.headers){const e=.5*(t["header-size"]+t["grid-padding"]);for(const n of new Array(s).keys()){const s=o.cellCenterXY(0,n,t);this.headerGroup.text(t["header-row-symbols"].charAt(n),{x:e,y:s[1]})}for(const s of new Array(a).keys()){const n=o.cellCenterXY(s,0,t);this.headerGroup.text(t["header-column-symbols"].charAt(s),{x:n[0],y:e})}}const c=t["cell-size"];this.cellRects=new i(this.g({id:"cell_rect",fill:"white"})),this.cellTexts=new i(this.g({id:"cell_text"}).attr(t["cell-font"]));for(const[e,i]of(0,n.MDIterator)([a,s])){const s=i*a+e,n=o.cellXY(e,i,t);this.cellRects.set(s,new r("rect",{x:n[0],y:n[1],width:c,height:c,rx:4,ry:4})),this.cellTexts.set(s,new r("text",{x:n[0]+.5*c,y:n[1]+.5*c}))}const d=t["mark-size"];this.markRects=new i(this.g({id:"mark_rect"})),this.markTexts=new i(this.g({id:"mark_text"}).attr(t["mark-font"]));for(const[e,i,l]of(0,n.MDIterator)([a,s,h])){const s=(i*a+e)*h+l,n=o.markXY(e,i,l,t);this.markRects.set(s,new r("rect",{x:n[0],y:n[1],width:d,height:d,rx:4,ry:4})),this.markTexts.set(s,new r("text").html(t["mark-symbols"].charAt(l)).attr({x:n[0]+.5*d,y:n[1]+.5*d}))}this.cellRects.showAll(),this.style=t}static computeStyle(e={}){if((e=Object.assign(Object.assign({},o.options),e)).rows!=e["header-row-symbols"].length)throw RangeError("The length of the row header does not match the number of rows.");if(e.columns!=e["header-column-symbols"].length)throw RangeError("The length of the column header does not match the number of columns.");if(Math.pow(e.dimension,2)!=e["mark-symbols"].length)throw RangeError("The length of the column header does not match the number of columns.");const t=e.dimension;e["cell-size"]=t*e["mark-size"]+(t-1)*e["cell-inner-sep"]+2*e["cell-padding"],e["box-size"]=t*e["cell-size"]+(t-1)*e["box-inner-sep"]+2*e["box-padding"];const s=[e.columns,e.rows],n=s.map((e=>Math.ceil(e/t))),r=s.map(((t,r)=>s[r]*e["cell-size"]+(s[r]-n[r])*e["box-inner-sep"]+2*n[r]*e["box-padding"]+(n[r]-1)*e["grid-inner-sep"]+2*e["grid-padding"]));return e["grid-width"]=r[0],e["grid-height"]=r[1],e["canvas-width"]=e["grid-width"]+("display"==e.headers?e["header-size"]:0),e["canvas-height"]=e["grid-height"]+("display"==e.headers?e["header-size"]:0),e}static cellXY(e,t,s){if(!("cell-size"in s))throw TypeError("The property 'cell-size' has not been computed yet.");const n=s.dimension,r=[e,t],i=r.map((e=>Math.trunc(e/n)));return r.map(((e,t)=>("display"==s.headers?s["header-size"]:0)+i[t]*s["grid-inner-sep"]+s["grid-padding"]+(r[t]-i[t])*s["box-inner-sep"]+(2*i[t]+1)*s["box-padding"]+r[t]*s["cell-size"]))}static cellCenterXY(e,t,s){if(!("cell-size"in s))throw TypeError("The property 'cell-size' has not been computed yet.");return o.cellXY(e,t,s).map((e=>e+.5*s["cell-size"]))}static markXY(e,t,s,n){if(!("cell-size"in n))throw TypeError("The property 'cell-size' has not been computed yet.");const r=n.dimension,i=[e,t],a=o.cellXY(e,t,n),l=[s%r,Math.trunc(s/r)];return i.map(((e,t)=>a[t]+l[t]*(n["cell-inner-sep"]+n["mark-size"])+n["cell-inner-sep"]))}static markCenterXY(e,t,s,n){return o.markXY(e,t,s,n).map((e=>e+.5*n["mark-size"]))}}t.PuzzleCanvas=o,o.options={rows:9,columns:9,dimension:3,"mark-size":14,"mark-symbols":"123456789","cell-inner-sep":1,"cell-padding":1,"box-inner-sep":1,"box-padding":0,"grid-inner-sep":3,"grid-padding":4,headers:"display","header-size":12,"header-row-symbols":"ABCDEFGHJ","header-column-symbols":"123456789",background:{fill:"black",rx:4,ry:4},"header-font":{"font-family":"Helvetica","font-size":10,fill:"white"},"mark-font":{"font-family":"Helvetica","font-size":9,fill:"black"},"cell-font":{"font-family":"Helvetica","font-size":30,fill:"black"},"rect:removed":{fill:"yellow",stroke:"pink","stroke-width":.75},"rect:determined":{fill:"#6fff83",stroke:"olive","stroke-width":.75},"rect:based":{fill:"#73b2ff",stroke:"blue","stroke-width":.75},"rect:affected":{fill:"lime",stroke:"green","stroke-width":.75},"text:removed":{fill:"red"},"text:determined":{fill:"blue"},"text:based":{},"text:affected":{}}},186:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Supergraph=void 0;const n=s(374);class r{constructor(e){this.type="basic",void 0===e?(this.VE=new n.IncidenceMatrix,this.EG=new n.IncidenceMatrix):(this.VE=e.VE.copy(),this.EG=e.EG.copy())}static merge(e,t){if(e.type!==t.type)throw TypeError("The type of the two graphs do not match.");const s=new r;return s.type=e.type,s.VE=n.IncidenceMatrix.union(e.VE,t.VE),s.EG=n.IncidenceMatrix.union(t.EG,t.EG),s}merge(e){if(this.type!==e.type)throw TypeError("The type of the two graphs do not match.");return new r,this.VE=n.IncidenceMatrix.union(this.VE,e.VE),this.EG=n.IncidenceMatrix.union(this.EG,e.EG),this}copy(){return r.merge(this,new r)}filter(e){const t=new r;return t.type=this.type,t.VE=this.VE.filter(((t,s)=>e(t,s,this))),t.EG=this.EG.filter(((e,s)=>t.VE.columns.has(e))),t}"E($v)"(e){return this.VE.rows.get(e)}"V($e)"(e){return this.VE.columns.get(e)}"G($e)"(e){return this.EG.rows.get(e)}"E($g)"(e){return this.EG.columns.get(e)}"V(${e})"(e){return Set.union(...e.map((e=>this["V($e)"](e))))}"V(E($v))"(e){return this["V(${e})"](this["E($v)"](e))}"V(E($v)&E($g))"(e,t){return this["V(${e})"](Set.intersection(this["E($v)"](e),this["E($g)"](t)))}"E(${v})"(e){return Set.union(...e.map((e=>this["E($v)"](e))))}"E(V($e))"(e){return this["E(${v})"](this["V($e)"](e))}"E(V($e))&E($g)"(e,t){return Set.intersection(this["E(V($e))"](e),this["E($g)"](t))}visibleFrom(e,t){const s=void 0===t?this["V(E($v))"](e):this["V(E($v)&E($g))"](e,t);return s.delete(e),s}}t.Supergraph=r},914:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.SOGame=void 0;const n=s(466),r=s(361);class i extends r.Supergraph{constructor(e){if(!Number.isInteger(e))throw RangeError("The dimensional parameter must be an integer.");if(e<1)throw RangeError("The dimensional parameter must be at least 1.");if(e>8)throw RangeError("Do you really want to solve such a large puzzle?");super(),this.type="sudoku original",this.Dp=e,this.D1=Math.pow(this.Dp,2),this.D2=Math.pow(this.D1,2),this.D3=Math.pow(this.D1,3),this.labels=new Map;const t=new n.BaseN(this.Dp),s=new n.BaseN(this.D1);for(const e of Array(this.D3).keys()){const[n,r,i]=s.toDigits(e,3),o=t.toDigits(e,6),a=t.fromDigits([o[0],o[2]]),l=t.fromDigits([o[1],o[3]]),h=(s.fromDigits([n,r]),s.fromDigits([n,i]),s.fromDigits([r,i]),s.fromDigits([a,i]),s.fromDigits([0,n,r])),c=s.fromDigits([1,n,i]),d=s.fromDigits([2,r,i]),u=s.fromDigits([3,a,i]);this.labels.set(e,{index:e,row:n,col:r,key:i,box:a,inn:l,rc:h,rk:c,ck:d,bk:u}),this.VE.add(e,h),this.VE.add(e,c),this.VE.add(e,d),this.VE.add(e,u),this.EG.add(h,"rc"),this.EG.add(c,"rk"),this.EG.add(d,"ck"),this.EG.add(u,"bk")}}}t.SOGame=i},374:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.IncidenceMatrix=void 0;class s{constructor(){this.rows=new Map,this.columns=new Map}*[Symbol.iterator](){for(const[e,t]of this.rows)for(const s of t)yield[e,s]}has(e,t){return this.rows.has(e)&&this.rows.get(e).has(t)}addRow(e){return this.rows.has(e)||this.rows.set(e,new Set),this}addColumn(e){return this.columns.has(e)||this.columns.set(e,new Set),this}add(e,t){return this.addRow(e),this.addColumn(t),this.rows.get(e).add(t),this.columns.get(t).add(e),this}deleteRow(e){if(this.rows.has(e)){const t=this.rows.get(e);for(const s of t){const t=this.columns.get(s);t.delete(e),0==t.size&&this.columns.delete(s)}return this.rows.delete(e),!0}return!1}deleteColumn(e){if(this.columns.has(e)){const t=this.columns.get(e);for(const s of t){const t=this.rows.get(s);t.delete(e),0==t.size&&this.rows.delete(s)}return this.columns.delete(e),!0}return!1}delete(e,t){return!!this.has(e,t)&&(this.rows.get(e).delete(t),this.columns.get(t).delete(e),!0)}clearEmpty(){return this.rows.clearEmptyKeys(),this.columns.clearEmptyKeys(),this}forEach(e){for(const[t,s]of this)e(t,s,this)}map(e){const t=new s;for(const[s,n]of this)t.add(...e(s,n,this));return t}filter(e){const t=new s;for(const[s,n]of this)e(s,n,this)&&t.add(s,n);return t}transpose(){return this.map(((e,t)=>[t,e]))}copy(){const e=new s;for(const[t,s]of this.rows)e.rows.set(t,new Set(s));for(const[t,s]of this.columns)e.columns.set(t,new Set(s));return e}static union(e,t){const s=e.copy();for(const[e,n]of t.rows)s.rows.has(e)?s.rows.set(e,Set.union(s.rows.get(e),n)):s.rows.set(e,n);for(const[e,n]of t.columns)s.columns.has(e)?s.columns.set(e,Set.union(s.columns.get(e),n)):s.columns.set(e,n);return s}}t.IncidenceMatrix=s},501:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(Map,"merge",{value:function e(t,s){const n=new Map(t);for(const[e,s]of t.entries())n.set(e,s);for(const[t,r]of s.entries())if(n.has(t)){const s=n.get(t);r instanceof Set&&s instanceof Set?n.set(t,Set.union(s,r)):r instanceof Map&&s instanceof Map?n.set(t,e(s,r)):n.set(t,r)}else n.set(t,r);return n},enumerable:!1}),Object.defineProperty(Map.prototype,"filter",{value:function(e){const t=new Map;for(const[s,n]of this)e(s,n,this)&&t.set(s,n);return t},enumerable:!1}),Object.defineProperty(Map.prototype,"map",{value:function(e){const t=new Map;for(const[s,n]of this)t.set(s,e(s,n,this));return t},enumerable:!1}),Object.defineProperty(Map.prototype,"clearEmptyKeys",{value:function(){const e=new Map;for(const[t,s]of this)void 0!==s&&(s instanceof Set&&0==s.size||s instanceof Map&&0==s.size||e.set(t,s));return e},enumerable:!1})},361:function(e,t,s){var n=this&&this.__createBinding||(Object.create?function(e,t,s,n){void 0===n&&(n=s);var r=Object.getOwnPropertyDescriptor(t,s);r&&!("get"in r?!t.__esModule:r.writable||r.configurable)||(r={enumerable:!0,get:function(){return t[s]}}),Object.defineProperty(e,n,r)}:function(e,t,s,n){void 0===n&&(n=s),e[n]=t[s]}),r=this&&this.__exportStar||function(e,t){for(var s in e)"default"===s||Object.prototype.hasOwnProperty.call(t,s)||n(t,e,s)};Object.defineProperty(t,"__esModule",{value:!0}),r(s(570),t),r(s(501),t),r(s(351),t),r(s(374),t),r(s(186),t)},351:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.MSet=void 0;class s extends Map{constructor(e){if(super(),e instanceof s)for(const[t,s]of e)this.set(t,s);else if(e)for(const t of e)this.add(t)}get count(){return Array.from(this.values()).reduce(((e,t)=>e+t),0)}aget(e){var t;return null!==(t=this.get(e))&&void 0!==t?t:0}modify(e,t){var s;const n=(null!==(s=this.get(e))&&void 0!==s?s:0)+t;return 0==n?this.delete(e):this.set(e,n),this}add(e){return this.modify(e,1)}remove(e){return this.modify(e,-1)}elements(){return this.keys()}every(e){for(const[t,s]of this)if(!e(t,s,this))return!1;return!0}some(e){for(const[t,s]of this)if(e(t,s,this))return!0;return!1}static geqZero(e){for(const[t,s]of e)if(s<0)return!1;return!0}static geq(e,t){var s,n;for(const[n,r]of e)if(r<(null!==(s=t.get(n))&&void 0!==s?s:0))return!1;for(const[s,r]of t)if(r>(null!==(n=e.get(s))&&void 0!==n?n:0))return!1;return!0}static add(...e){var t;const n=new s;for(const s of e)for(const[e,r]of s)n.set(e,(null!==(t=n.get(e))&&void 0!==t?t:0)+r);for(const[e,t]of n)0==t&&n.delete(e);return n}static subtract(e,t){var n;const r=new s;for(const[t,s]of e)r.set(t,s);for(const[e,s]of t)r.set(e,(null!==(n=r.get(e))&&void 0!==n?n:0)-s);for(const[e,t]of r)0==t&&r.delete(e);return r}pick(e){for(const e of this.keys())return e;return e}}t.MSet=s},570:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0});const s=function(...e){if(0==e.length)return new Set;if(1==e.length)return new Set(e[0]);if(2==e.length){const[t,s]=e[0].size>e[1].size?e:e.reverse(),n=new Set(t);for(const e of s)n.add(e);return n}return s(s(...e.slice(0,2)),...e.slice(2))},n=function(...e){if(0==e.length)throw RangeError("Set intersection requires at least one set.");if(1==e.length)return new Set(e[0]);if(2==e.length){const[t,s]=e[0].size<e[1].size?e:e.reverse(),n=new Set(t);for(const e of t)s.has(e)||n.delete(e);return n}return n(n(...e.slice(0,2)),...e.slice(2))};Object.defineProperty(Set,"union",{value:s,enumerable:!1}),Object.defineProperty(Set,"intersection",{value:n,enumerable:!1}),Object.defineProperty(Set,"diff",{value:function(e,t){const s=new Set(e);for(const e of t)s.delete(e);return s},enumerable:!1}),Object.defineProperty(Set.prototype,"filter",{value:function(e){const t=new Set;for(const s of this)e(s,this)&&t.add(s);return t},enumerable:!1}),Object.defineProperty(Set.prototype,"map",{value:function(e){const t=new Set;for(const s of this)t.add(e(s,this));return t},enumerable:!1})},798:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.SOSolver=void 0;const n=s(787),r=s(963);class i extends n.Originator{constructor(e,t){super(),this.game=e,this.canvas=new r.PuzzleCanvas(t),this.snapshot={vertices:new Set,clues:new Set,determined:new Set,pencilmarked:new Set,annotations:[]},this.selected=-1}load(e){this.snapshot=e.snapshot,this.selected=e.selected;for(const t of e.logs)console.log(t);this.render()}render(){var e,t,s,n,r;const i=this.snapshot.vertices,o=this.snapshot.clues,a=this.snapshot.determined,l=this.snapshot.pencilmarked,h=this.snapshot.annotations,c=this.game.filter(((e,t)=>i.has(e))),d=this.canvas.style;this.canvas.cellRects.clearAll(),this.canvas.cellTexts.hideAll().clearAll(),this.canvas.markRects.hideAll().clearAll(),this.canvas.markTexts.hideAll().clearAll();for(const e of c.EG.columns.get("rc")){const t=c.VE.columns.get(e);1==t.size?t.forEach((t=>{o.has(t)?this.canvas.cellTexts.show(e).html(`${d["mark-symbols"].charAt(t%9)}`).attr({fill:"blue"}):a.has(t)?this.canvas.cellTexts.show(e).html(`${d["mark-symbols"].charAt(t%9)}`):this.canvas.markTexts.show(t)})):0==t.size?this.canvas.cellTexts.show(e).html("X").attr({fill:"red"}):l.has(e)&&t.forEach((e=>{this.canvas.markTexts.show(e)}))}for(const i of h){const o=i.match(/^highlight (\S+) (\d+) as (.*)$/);if(o){const i=o[1],a=Number.parseInt(o[2]),l=o[3];"mark"==i?(null===(e=this.canvas.markRects.show(a))||void 0===e||e.attr(d[`rect:${l}`]),null===(t=this.canvas.markTexts.get(a))||void 0===t||t.attr(d[`text:${l}`])):"cell"==i||"rc"==i?(null===(s=this.canvas.cellRects.show(a))||void 0===s||s.attr(d[`rect:${l}`]),null===(n=this.canvas.cellTexts.get(a))||void 0===n||n.attr(d[`text:${l}`])):"rk"!=i&&"ck"!=i&&"bk"!=i||null===(r=this.game["V($e)"](a))||void 0===r||r.forEach((e=>{var t,s;const n=Math.trunc(e/this.game.D1);null===(t=this.canvas.cellRects.show(n))||void 0===t||t.attr(d[`rect:${l}`]),null===(s=this.canvas.cellTexts.get(n))||void 0===s||s.attr(d[`text:${l}`])}))}}}obviousCandidateRemoval(e){let t=!1;const s=e,n=new Set(this.snapshot.vertices),r=this.snapshot.determined,i=new Array,o=[{type:"initial",logs:["updated by obvious candidate removal"],snapshot:{pencilmarked:e.EG.columns.get("rc"),annotations:i}},{type:"final",logs:[],snapshot:{vertices:n,annotations:[]}}];for(const e of r)for(const r of s.visibleFrom(e))t=!0,n.delete(r),i.push(`highlight mark ${r} as removed`);return t?o:[]}nakedSingle(e){let t=!1;const s=e,n=new Set(this.snapshot.determined),r=new Array,i=[{type:"initial",logs:["updated by naked single"],snapshot:{determined:n,annotations:r}},{type:"final",logs:[],snapshot:{annotations:[]}}];for(const e of s["E($g)"]("rc")){const i=s["V($e)"](e),o=[...i][0];if(1==i.size&&!n.has(o)){t=!0;const e=Math.trunc(o/this.game.D1);n.add(o),r.push(`highlight cell ${e} as determined`)}}return t?i:[]}hiddenSingle(e){var t,s;const n=e,r=new Set(this.snapshot.vertices),i=new Set(this.snapshot.determined),o=new Array,a=new Array,l=[{type:"initial",logs:["updated by hidden single"],snapshot:{annotations:o}},{type:"middle",logs:[],snapshot:{annotations:a}},{type:"final",logs:[],snapshot:{vertices:r,annotations:[]}}];for(const e of["bk","rk","ck"])for(const h of n["E($g)"](e)){const c=n["V($e)"](h);if(c.size>1)continue;const d=[...c][0];if(i.has(d))continue;const u=n.visibleFrom(d,"rc");if(0!=u.size){null===(t=l[0].logs)||void 0===t||t.push(`log "Vertex ${d} is a hidden single in the ${e} containing it."`),o.push(`highlight mark ${d} as determined`),o.push(`highlight ${e} ${h} as based`);for(const e of u)r.delete(e),null===(s=l[1].logs)||void 0===s||s.push(`log "Vertex ${e} is in the same unit as the hidden single, hence is removed."`),a.push(`highlight mark ${e} as removed`);return l}}return[]}intersectionPointing(e){var t,s;const n=e,r=new Set(this.snapshot.vertices),i=new Array,o=new Array,a=[{type:"initial",logs:["updated by intersection (pointing)"],snapshot:{annotations:i}},{type:"middle",logs:[],snapshot:{annotations:o}},{type:"final",logs:[],snapshot:{vertices:r,annotations:[]}}];console.time("bm1");for(const e of["rk","ck"])for(const l of n["E($g)"](e)){const h=[...n["E(V($e))&E($g)"](l,"bk")][0],c=n["V($e)"](h),d=n["V($e)"](l),u=Set.intersection(c,d);if(!(c.size>u.size)&&d.size!=u.size){null===(t=a[0].logs)||void 0===t||t.push(`log "Vertices ${[...u]} form a pointer in the box containing it."`),u.forEach((e=>{i.push(`highlight mark ${e} as determined`)})),i.push(`highlight ${e} ${l} as affected`),i.push(`highlight bk ${h} as based`);for(const e of Set.diff(d,u))r.delete(e),null===(s=a[1].logs)||void 0===s||s.push(`log "Vertex ${e} is outside of the box and pointed by the pointer."`),o.push(`highlight mark ${e} as removed`);return a}}return console.timeLog("bm1"),console.timeEnd("bm1"),[]}intersectionClaiming(e){var t,s;const n=e,r=new Set(this.snapshot.vertices),i=new Array,o=new Array,a=[{type:"initial",logs:["updated by intersection (pointing)"],snapshot:{annotations:i}},{type:"middle",logs:[],snapshot:{annotations:o}},{type:"final",logs:[],snapshot:{vertices:r,annotations:[]}}];for(const e of["rk","ck"])for(const l of n["E($g)"](e)){const h=[...n["E(V($e))&E($g)"](l,"bk")][0],c=n["V($e)"](h),d=n["V($e)"](l),u=Set.intersection(c,d);if(c.size!=u.size&&!(d.size>u.size)){null===(t=a[0].logs)||void 0===t||t.push(`log "Vertices ${[...d]} form a clamer in the line containing it."`),u.forEach((e=>{i.push(`highlight mark ${e} as determined`)})),i.push(`highlight bk ${h} as affected`),i.push(`highlight ${e} ${l} as based`);for(const e of Set.diff(c,u))r.delete(e),null===(s=a[1].logs)||void 0===s||s.push(`log "Vertex ${e} is outside of the box and pointed by the pointer."`),o.push(`highlight mark ${e} as removed`);return a}}return[]}}t.SOSolver=i},929:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.uint8_to_b64=t.b64_to_uint8=void 0;const s=[...String.fromCharCode(...new Array(26).fill(0).map(((e,t)=>65+t))),...String.fromCharCode(...new Array(26).fill(0).map(((e,t)=>97+t))),...String.fromCharCode(...new Array(10).fill(0).map(((e,t)=>48+t))),"+","/"],n=new Map(s.map(((e,t)=>[e,t])));n.set("=",0);const r=/^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;t.uint8_to_b64=e=>{var t,n;const r=Math.ceil(e.length/3),i=new Array(4*r);for(let o=0;o<r;o++){const r=e.subarray(3*o,3*(o+1)),a=r[0],l=null!==(t=r[1])&&void 0!==t?t:0,h=null!==(n=r[2])&&void 0!==n?n:0;i[4*o]=s[a>>2],i[4*o+1]=s[(3&a)<<4|l>>4],i[4*o+2]=s[(15&l)<<2|h>>6],i[4*o+3]=s[63&h]}return e.length%3==1&&(i[i.length-1]="=",i[i.length-2]="="),e.length%3==2&&(i[i.length-1]="="),i.join("")},t.b64_to_uint8=e=>{var t;if(!e.match(r))throw TypeError("The input does not match the base64 format.");const s=Math.trunc(e.length/4),i=(null!==(t=e.match(/={1,2}$/))&&void 0!==t?t:[])[0].length,o=new Uint8Array(3*s-i);for(let t=0;t<s;t++){const s=[...e.substring(4*t,4*(t+1))],[r,i,a,l]=s.map((e=>{var t;return null!==(t=n.get(e))&&void 0!==t?t:0}));o[3*t]=r<<2|i>>4,o[3*t+1]=(15&i)<<4|a>>2,o[3*t+2]=(3&a)<<6|l}return o}},793:(e,t,s)=>{var n;Object.defineProperty(t,"__esModule",{value:!0}),t.PuzzleIO=void 0;const r=s(929);class i{static import(e,t,s="base64"){if("sudoku original"!=e.type)throw TypeError("The game is not a sudoku original.");e.Dp;const n=e.D1,i=e.D2,o=e.D3;if(t.length==i?s="simple":"data:"==t.substring(0,5)&&(s="base64"),"simple"==s){const e=[];for(const[s,r]of Array.from(t).entries()){const t=s*n;if(this.importSymbols.has(r))e.push(t+this.importSymbols.get(r));else for(const s of new Array(n).keys())e.push(t+s)}return new Set(e)}if("base64"==s){const e=(0,r.b64_to_uint8)(t.substring(5)),s=[];for(const[t,n]of e.entries()){let e=8*t;for(let t=0;t<8&&!(e>=o);t++)(n&1<<t)>0&&s.push(e),e++}return new Set(s)}throw TypeError(`'${s}' is not a valid format.`)}static export(e,t,s="base64"){if("sudoku original"!=e.type)throw TypeError("The game is not a sudoku original.");e.Dp;const n=e.D1,i=e.D2,o=e.D3;if("simple"==s){const e=new Array(i).fill("!");for(const s of t){const t=Math.trunc(s/n),r=s%n;"!"==e[t]?e[t]=this.exportSymbols[r]:e[t]="."}return e.join("")}if("base64"==s){const e=new Uint8Array(Math.ceil(o/8));for(const s of e.keys()){let n=0;for(let e=0;e<8;e++){const r=8*s+e;t.has(r)&&(n|=1<<e)}e[s]=n}return`data:${(0,r.uint8_to_b64)(e)}`}throw TypeError(`'${s}' is not a valid format.`)}}t.PuzzleIO=i,n=i,i.exportSymbols=["1","2","3","4","5","6","7","8","9",...String.fromCharCode(...new Array(26).fill(0).map(((e,t)=>65+t))),...String.fromCharCode(...new Array(26).fill(0).map(((e,t)=>97+t))),"<",">"],i.importSymbols=new Map(n.exportSymbols.map(((e,t)=>[e,t])))},787:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Caretaker=t.Memento=t.Originator=void 0,t.Originator=class{};class s{constructor(e="undefined",t){this.type="undefined",this.type=e,this.snapshot={},this.logs=[],this.selected=NaN,void 0!==t&&this.copyFrom(t)}isInitial(){return null!=this.type.match(/initial/)}isFinal(){return null!=this.type.match(/final/)}copyFrom(e){var t,s,n;return this.type=null!==(t=e.type)&&void 0!==t?t:this.type,this.logs=null!==(s=e.logs)&&void 0!==s?s:this.logs,this.selected=e.selected&&NaN!=e.selected?e.selected:this.selected,Object.assign(this.snapshot,null!==(n=e.snapshot)&&void 0!==n?n:{}),this}}t.Memento=s,t.Caretaker=class{constructor(e){this.history=new Array,this.time=-1,this.originator=e}atEnd(){return this.time==this.history.length-1}last(){var e;return null!==(e=this.history[this.history.length-1])&&void 0!==e?e:null}getLastFinalTime(e){for(let t=e;t>=0;t--)if(this.history[t].isFinal())return t;return-1}init(e){if(this.history.length>0)throw Error("You cannot initialize the history twice.");this.history.push(e),this.time=0}addSegment(e){const t=this.getLastFinalTime(this.time);if(-1==t)throw RangeError("Something is wrong; there are no final events up to the specified time.");this.history=this.history.slice(0,t+1);for(const t of e)this.history.push((new s).copyFrom(this.last()).copyFrom(t))}moveTo(e){return!(e>=this.history.length||e<0||(this.time=e,this.originator.load(this.history[this.time]),0))}moveBy(e){return this.moveTo(this.time+e)}}},466:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.init=t.MDIterator=t.IntegerRange=t.BaseN=void 0,t.BaseN=class{constructor(e){this.base=e}fromDigits(e){return e.reduce(((e,t)=>e*this.base+t),0)}toDigits(e,t){const s=Array.from({length:t});for(let n=t-1;n>0;n--)s[n]=e%this.base,e=Math.trunc(e/this.base);return s[0]=e,s}};class s{constructor(e,t){void 0===t?(this.a=0,this.b=e):(this.a=e,this.b=t)}at(e){return this.a+e}get length(){return this.b-this.a}set length(e){this.b=this.a+e}*keys(){const e=this.b-this.a;for(let t=0;t<e;t++)yield t}*values(){for(let e=this.a;e<this.b;e++)yield e}*[Symbol.iterator](){for(let e=this.a;e<this.b;e++)yield e}*entries(){const e=this.b-this.a;for(let t=0;t<e;t++)yield[t,this.a+t]}map(e){const t=this.b-this.a,s=new Array(t);for(let n=0;n<t;n++)s[n]=e(this.a+n,n);return s}forEach(e){const t=this.b-this.a;new Array(t);for(let s=0;s<t;s++)e(this.a+s,s)}}t.IntegerRange=s,t.MDIterator=function*e(t,s=[]){if(1==t.length)for(let e=0;e<t[0];e++)yield[...s,e];else for(let n=0;n<t[0];n++)yield*e(t.slice(1),[...s,n])},t.init=(e,t)=>{const s=new Array(e);for(const e of s.keys())s[e]=t(e);return s}}},t={};function s(n){var r=t[n];if(void 0!==r)return r.exports;var i=t[n]={exports:{}};return e[n].call(i.exports,i,i.exports,s),i.exports}(()=>{const e=s(914),t=s(798),n=s(787),r=s(793);console.log("Sudoku Solver build 007");const i=document.getElementById("logs"),o=document.getElementById("puzzle"),a=new e.SOGame(3),l=new t.SOSolver(a);l.canvas.addTo(o);const h=new n.Caretaker(l);var c;!function(e){var t,s;const o=r.PuzzleIO.import(a,"001000000920400076000500002000120364007000050000900000000000005008050100019240000");console.log("Puzzle has been successfully imported.");const c=a.filter(((e,t)=>o.has(e))),d=c.EG.columns.get("rc"),u=Set.union(...c.VE.columns.filter(((e,t)=>d.has(e)&&1==t.size)).values());l.snapshot.vertices=o,l.snapshot.clues=u,l.snapshot.determined=u,h.init(new n.Memento("initial|final",{snapshot:l.snapshot,logs:["Puzzle loaded."],selected:-1})),l.render();const f=[l.obviousCandidateRemoval,l.nakedSingle,l.hiddenSingle,l.intersectionPointing,l.intersectionClaiming];null===(t=document.getElementById("prev"))||void 0===t||t.addEventListener("click",(()=>{i.replaceChildren(),h.moveBy(-1),console.log(`At time: ${h.time}`)})),null===(s=document.getElementById("next"))||void 0===s||s.addEventListener("click",(()=>{if(i.replaceChildren(),h.atEnd()){const e=l.snapshot.vertices,t=a.filter(((t,s)=>e.has(t)));for(const e of f){const s=e.call(l,t);if(0!=s.length){h.addSegment(s);break}}}h.moveBy(1),console.log(`At time: ${h.time}`)}))}(c||(c={}))})()})();