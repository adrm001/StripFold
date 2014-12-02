var AM = AM || {};


AM.Test = function () {

};

AM.Test.prototype = {
    points: [],
    edges: [],
    foldIndex: 0,
    delta: 1,

    addPoint: function Test$addPoint() {
        this.points[this.points.length] = new AM.SvgPoint(this.points[this.points.length - 1]);
    },
    createStrip: function Test$createStrip() {
        this.edges.forEach(function (elem, index, array) {
            elem.removeSVG();
        });
        this.edges = [];
        var prev = null;
        this.points.forEach(function (elem, index, array) {
            this.edges[this.edges.length] = new AM.Edge(elem.fPointA, elem.fPointB, prev);
            prev = this.edges[this.edges.length - 1];
        }, this);
        this.foldIndex = 0;
    },
    unfold: function () {
        if(this.foldIndex > 0 && this.foldIndex <= this.edges.length-2) {
            this.edges[this.foldIndex].fold();
        }

        this.foldIndex += this.delta;

        if(this.foldIndex === this.edges.length) {
            this.delta=-1;
        }
        if(this.foldIndex===0){
            this.delta=1;
        }

    }
};

AM.SvgPoint = function (prev) {
    var x;
    var y;

    if (prev) {
        x = prev.point.x + 15;
        y = prev.point.y + 15;
        this.pLine = svg.line(prev.point.x, prev.point.y, x, y).stroke({ width: 3 });
        this.ptl = svg.line(prev.point.x, prev.point.y, x, y).stroke({ width: 3 });
        this.pbl = svg.line(prev.point.x, prev.point.y, x, y).stroke({ width: 3 });
        this.prev = prev;
        prev.next = this;
        prev.nLine = this.pLine;
        prev.ntl = this.ptl;
        prev.nbl = this.pbl;
    }
    else {
        x = 50;
        y = 50;
    }
    this.point = new AM.Math.Vec2d(x, y);
    this.circle = svg.circle(20).center(x, y);
    this.circle.draggable();
    this.circle.dragmove = this.dragMove.bind(this);
    this.calcFold();
};

AM.SvgPoint.prototype = {
    point: null,
    circle: null,
    pLine: null,
    prev: null,
    next: null,
    nLine: null,
    fold: null,
    fPointA: null,
    fPointB: null,
    ptl: null,
    pbl: null,
    ntl: null,
    nbl: null,

    dragMove: function (delta, event) {
        this.point.x = this.circle.cx();
        this.point.y = this.circle.cy();
        if (this.pLine) {
            var p = this.prev.point;
            this.pLine.plot(p.x, p.y, this.point.x, this.point.y);
        }
        if (this.nLine) {
            var n = this.next.point;
            this.nLine.plot(this.point.x, this.point.y, n.x, n.y);
        }
        this.calcFold();
        if (this.prev) {
            this.prev.calcFold();
        }
        if (this.next) {
            this.next.calcFold();
        }
        this.connectFolds();
        if (this.prev) {
            this.prev.connectFolds();
        }
        if (this.next) {
            this.next.connectFolds();
        }
    },
    calcFold: function () {
        if (!this.prev && !this.next) {
            return;
        }
        var angle;
        var dot;
        var dir;
        if (this.prev) {
            dir = this.prev.point.subtract(this.point).norm();
        } else {
            dir = this.point.subtract(this.next.point).norm().scale(-1);
        }
        if (this.next && this.prev) {
            var otherDir = this.next.point.subtract(this.point).norm();
            angle = (Math.PI - dir.angle(otherDir)) / 2;
            dot = dir.dot(otherDir);
            var cross = dir.cross(otherDir);
            if (cross > 0) {
                angle = -angle;
            }
        } else {
            angle = AM.Math.ToRad(90);
        }
        angleSpan.innerHTML = AM.Math.ToDeg(angle);
        dotSpan.innerHTML = dot;
        var size = width / (Math.cos(AM.Math.ToRad(90) - angle));
        var foldA = dir.rotate(angle).scale(size);
        var foldB = dir.rotate(angle).scale(-size);
        this.fPointA = this.point.add(foldA);
        this.fPointB = this.point.add(foldB);

        if (this.fold) {
            this.fold.plot(this.fPointA.x, this.fPointA.y, this.fPointB.x, this.fPointB.y);
        } else {
            this.fold = svg.line(this.fPointA.x, this.fPointA.y, this.fPointB.x, this.fPointB.y).stroke({ width: 3 });
        }
    },
    connectFolds: function () {
        var a = this.fPointA;
        var b = this.fPointB;
        if (this.prev) {
            var pb = this.prev.fPointB;
            var pa = this.prev.fPointA;
            this.ptl.plot(pb.x, pb.y, a.x, a.y);
            this.pbl.plot(pa.x, pa.y, b.x, b.y);
        }
        if (this.next) {
            var nb = this.next.fPointB;
            var na = this.next.fPointA;
            this.ntl.plot(b.x, b.y, na.x, na.y);
            this.nbl.plot(a.x, a.y, nb.x, nb.y);
        }
    }
};

AM.Edge = function (top, bot, prev) {
    this.top = top;
    this.bot = bot;
    this.prev = prev;
    if (prev) {
        prev.next = this;
        this.poly = svg.polygon(this.polyArr()).fill('green').stroke({width: 2, color: "red"});
    }
    this.line = new AM.Math.Line(top, bot);
};

AM.Edge.prototype = {
    top: null,
    bot: null,
    prev: null,
    next: null,
    line: null,
    poly: null,

    removeSVG: function () {
        if (this.poly) {
            this.poly.remove();
        }
    },
    polyArr: function () {
        var a = this.prev.top;
        var b = this.prev.bot;
        var c = this.top;
        var d = this.bot;

        return [
            [a.x, a.y],
            [b.x, b.y],
            [c.x, c.y],
            [d.x, d.y]
        ];
    },
    fold: function (line) {
        if (line) {
            this.top = this.top.add(line.vector2LineFromPoint(this.top).scale(2));
            this.bot = this.bot.add(line.vector2LineFromPoint(this.bot).scale(2));
            this.line = new AM.Math.Line(this.top, this.bot);
        }
        else {
            line = this.line;
        }
        if(this.poly) {
            this.poly.plot(this.polyArr());
        }
        if (this.next) {
            this.next.fold(line);
        }
    }
};

var hooks = new AM.Test();
var svg = {};
var width = 15;
var angleSpan = null;
var dotSpan = null;
AM.Load = function () {
    svg = SVG("drawing");
    angleSpan = document.getElementById("angle");
    dotSpan = document.getElementById("dot");
}