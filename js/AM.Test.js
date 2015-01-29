var AM = AM || {};

AM.Test = function () {

};
var M = [[0,0],[49,-170],[100,0],[150,-30],[125,-170],[75,-50],[80,-60],[10,-60]];
AM.Test.prototype = {
    points: [],
    edges: [],
    folded: true,
    center: null,
    angle: 0,

    addPoint: function Test$addPoint() {
        this.showPoints();
        this.points[this.points.length] = new AM.SvgPoint(this.points[this.points.length - 1]);
    },
    createStrip: function Test$createStrip() {
        this.hidePoints();
        //this.edges.forEach(function (elem) {
        //    elem.removeSVG();
        //});
        //this.edges = [];
        //var prev = null;
        //this.points.forEach(function (elem) {
        //    this.edges[this.edges.length] = new AM.Edge(elem.fPointA, elem.fPointB, prev);
        //    prev = this.edges[this.edges.length - 1];
        //}, this);
        //this.foldIndex = 0;
        //var ret = this.edges[0].straighten();
        //this.center = ret.center;
        //this.angle = ret.angle;
        //AM.Bundle(this.edges);
        if (this.letter) {
            this.letter.RemoveSvg();
        }
        var points = [];
        var orig = this.points[0].point;
        var points2d = [];
        this.points.forEach(function (elem) {
            points.push(elem.point.subtract(orig));
        });
        points.forEach(function (elem) {
            points2d.push([elem.x,elem.y]);
        });

        this.letter = new AM.PaperLetter(svg, points, orig, width, '#0099CC', '#26697F');
    },
    hidePoints: function () {
        this.points.forEach(function (elem) {
            elem.hide();
        });
    },
    showPoints: function () {
        this.points.forEach(function (elem) {
            elem.show();
        });
    },
    unfold: function () {
        //if (this.folded) {
        //    this.edges[0].rotate(this.center, this.angle);
        //    this.edges[1].fold(AM.Edge.unfold);
        //    this.folded = false;
        //} else {
        //    this.edges[0].rotate(this.center, -this.angle);
        //    this.edges[1].fold(AM.Edge.fold);
        //    this.folded = true;
        //}
        this.letter.FoldUnfold();
    },
    arrange: function () {
        var min = 1000000;
        var col = [];
        this.edges.forEach(function (e) {
            min = e.zIndex < min ? e.zIndex : min
        });
        for (var i = 1; i < this.edges.length; i++) {
            var e = this.edges[i];
            if (!col[e.zIndex - min]) {
                col[e.zIndex - min] = [];
            }
            col[e.zIndex - min].push(e);
        }
        for (var i = 0; i < col.length; i++) {
            var row = col[i];
            if (row) {
                for (var j = 0; j < row.length; j++) {
                    var edge = row[j];
                    edge.shadow.front();
                }
                for (var j = 0; j < row.length; j++) {
                    var edge = row[j];
                    edge.poly.front();
                }
            }
        }
    }
};

AM.SvgPoint = function (prev) {
    var x;
    var y;

    if (prev) {
        x = prev.point.x + 15;
        y = prev.point.y + 15;
        this.pLine = svg.line(prev.point.x, prev.point.y, x, y).stroke({width: 3});
        this.ptl = svg.line(prev.point.x, prev.point.y, x, y).stroke({width: 3, color: 'red'});
        this.pbl = svg.line(prev.point.x, prev.point.y, x, y).stroke({width: 3});
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
    mark: null,

    hide: function () {
        var arr = [];
        arr[0] = this.circle;
        arr[1] = this.pLine;
        arr[2] = this.fold;
        arr[3] = this.ptl;
        arr[4] = this.pbl;

        arr.forEach(function (e) {
            if (e) {
                e.hide();
            }
        });
    },
    show: function () {
        var arr = [];
        arr[0] = this.circle;
        arr[1] = this.pLine;
        arr[2] = this.fold;
        arr[3] = this.ptl;
        arr[4] = this.pbl;

        arr.forEach(function (e) {
            if (e) {
                e.show();
            }
        });
    },
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
        var cross;
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
        var size = width / (Math.cos(AM.Math.ToRad(90) - angle));
        var foldA = dir.rotate(angle).scale(size);
        var foldB = dir.rotate(angle).scale(-size);
        this.fPointA = this.point.add(foldA);
        this.fPointB = this.point.add(foldB);


        if (this.fold) {
            this.fold.plot(this.fPointA.x, this.fPointA.y, this.fPointB.x, this.fPointB.y);
        } else {
            this.fold = svg.line(this.fPointA.x, this.fPointA.y, this.fPointB.x, this.fPointB.y).stroke({width: 3});
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
        this.shadow = svg.polygon(this.polyArr()).stroke({width: 1});
        this.poly = this.shadow.clone();
        this.shadow.filter(function (add) {
            add.offset(0, 0).in(add.sourceAlpha).gaussianBlur(2);
        });
        //this.shadow.hide();
        //this.poly.hide();
        this.z = prev.z + 1;
        this.zIndex = this.z;
        this.sideUp = !prev.sideUp;
        this.colorPoly();
    }
    this.line = new AM.Math.Line(top, bot);
    this.zIndex = this.z;
};
AM.Edge.unfold = function (edge) {
    if (edge.zIndex >= 0) {
        edge.zIndex = -(edge.zIndex - 1);
    }
    else if (edge.zIndex < 0) {
        edge.zIndex = -(edge.zIndex + 1);
    }
};
AM.Edge.fold = function (edge) {
    edge.zIndex++;
};
AM.Edge.prototype = {
    top: null,
    bot: null,
    prev: null,
    next: null,
    line: null,
    poly: null,
    shadow: null,
    sideUp: true,
    z: -1,
    zIndex: -1,

    center: function () {
        return this.top.add(this.bot).scale(.5);
    },
    colorPoly: function () {
        if (this.sideUp) {
            this.poly.fill('green');
            this.poly.stroke('green');
        }
        else {
            this.poly.fill('blue');
            this.poly.stroke('blue');
        }
    },
    removeSVG: function () {
        if (this.poly) {
            this.poly.remove();
        }
        if (this.shadow) {
            this.shadow.remove();
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
    straighten: function (dirAngle) {
        if (!this.next) {
            return;
        }
        dirAngle = dirAngle % 360;
        var dir = new AM.Math.Vec2d(Math.cos(AM.Math.ToRad(dirAngle)),Math.sin(AM.Math.ToRad(dirAngle)));
        var center = AM.Math.Vec2d.lerp(this.top, this.bot, .5);
        var dest = AM.Math.Vec2d.lerp(this.next.top, this.next.bot, .5);
        var toDes = dest.subtract(center).norm();
        var angle = toDes.angle(new AM.Math.Vec2d(1, 0));
        var cross = toDes.cross(new AM.Math.Vec2d(1, 0));
        if (cross < 0) {
            angle = -angle;
        }
        return {center: center, angle: angle};
    },
    rotate: function (center, angle) {

        this.top = this.top.subtract(center).rotate(angle).add(center);
        this.bot = this.bot.subtract(center).rotate(angle).add(center);
        this.line = new AM.Math.Line(this.top, this.bot);
        if (this.poly) {
            this.shadow.animate(250).plot(this.polyArr());
            this.poly.animate(250).plot(this.polyArr());
        }
        if (this.next) {
            this.next.rotate(center, angle);
        }
    },
    fold: function (zFunc, line, cb) {
        if (line) {
            var topvec = line.vector2LineFromPoint(this.top).scale(2);
            var botvec = line.vector2LineFromPoint(this.bot).scale(2);
            this.top = this.top.add(topvec);
            this.bot = this.bot.add(botvec);
            this.line = new AM.Math.Line(this.top, this.bot);
            var flipped = false;
            this.shadow.animate(250).plot(this.polyArr());
            this.poly.animate(250).plot(this.polyArr()).during(function (pos) {
                if (pos >= .5 && !flipped) {
                    flipped = true;
                    this.sideUp = !this.sideUp;
                    zFunc(this);
                    this.colorPoly();
                    if (!this.next) {
                        hooks.arrange();
                    }
                }
            }.bind(this)).after(function () {
                if (!this.next && cb) {
                    cb();
                }
            }.bind(this));
        }
        else {
            line = this.line;
            cb = this.foldNext.bind(this, zFunc);
        }
        if (this.next) {
            this.next.fold(zFunc, line, cb);
        }
    },
    foldNext: function (zFunc) {
        if (this.next) {
            this.next.fold(zFunc);
        }
    }
};

AM.Bundle = function (edges) {

    var pairs = [];
    var firstPair;
    var secondPair;
    for (var i = 0; i < edges.length; i++) {
        firstPair = null;
        secondPair = null;
        if (i === 0 || i === (edges.length - 1)) {
            firstPair = {a: edges[i].top, b: edges[i].bot, w: (Math.random() * .6)};
        } else {
            var p = edges[i - 1];
            var n = edges[i + 1];
            var e = edges[i];
            var c1 = AM.Math.Line.Intersection(e.top, n.bot, e.bot, p.top);
            var c2 = AM.Math.Line.Intersection(e.top, p.bot, e.bot, n.top);
            var d1 = c1.subtract(p.center()).magnitude();
            var d2 = c2.subtract(p.center()).magnitude();
            if (d1 <= d2) {
                firstPair = {a: e.top, b: c1, w: (Math.random() * .6)};
                secondPair = {a: e.bot, b: c1, w: (Math.random() * .6)};
            } else {
                firstPair = {a: e.bot, b: c2, w: (Math.random() * .6)};
                secondPair = {a: e.top, b: c2, w: (Math.random() * .6)};
            }

        }

        /*if(i>0){
         var distBetween = 25;
         var numPairs = Math.floor((pairs[pairs.length-1].a.subtract(firstPair.b).magnitude())/distBetween) - 1;
         for(var j = 0; j<numPairs; j++){
         var step = 1/(numPairs + 1);
         var t = (j+1)*step;
         pairs.push({a:AM.Math.Vec2d.lerp(pairs[pairs.length-1].a,firstPair.b,t), b:AM.Math.Vec2d.lerp(pairs[pairs.length-1].b,firstPair.a,t), w:(Math.random()*.6)});
         }
         }*/
        pairs.push(firstPair);
        if (secondPair) {
            pairs.push(secondPair);
        }
    }

    this.paths = [];
    for (var num = 0; num < 50; num++) {
        var cPoints = [];
        for (i = 0; i < pairs.length; i++) {
            cPoints.push(AM.Math.Vec2d.lerp(pairs[i].a, pairs[i].b, Math.random() * .5 + .25));
            if (i === 0) {
                cPoints.push(cPoints[0]);
            }
            if (i === pairs.length - 1) {
                cPoints.push(cPoints[cPoints.length - 1]);
            }
            //svg.circle(10).move(cPoints[cPoints.length-1].x,cPoints[cPoints.length-1].y);
            //svg.line(pairs[i].a.x,pairs[i].a.y,pairs[i].b.x,pairs[i].b.y).stroke('black');
        }
        var pStr = "";
        pStr += "M " + cPoints[0].x + " " + cPoints[0].y;
        for (i = 1; i < cPoints.length - 2; i++) {
            var c1 = cPoints[i + 1].subtract(cPoints[i - 1]).norm().scale(10);
            var c2 = cPoints[i].subtract(cPoints[i + 2]).norm().scale(10);
            var p2 = cPoints[i + 1];
            c1 = c1.add(cPoints[i]);
            c2 = c2.add(cPoints[i + 1]);
            //svg.circle(5).move(c1.x,c1.y).fill('red');
            //svg.circle(5).move(c2.x,c2.y).fill('green');
            pStr += " C " + c1.x + " " + c1.y + " " + c2.x + " " + c2.y + " " + p2.x + " " + p2.y;
        }
        var color = '#' + (Math.random().toString(16) + '000000').slice(2, 8);
        this.paths.push(svg.path(pStr).fill('none').stroke({color: 'red', opacity: .1, width: 2}).back());
    }

    /*
     var mid = AM.Math.Line.Intersection(a,c,b,d);
     this.paths = [];
     if(mid){
     var num = 50;
     for(var i = 0;i<num;i++){
     var p1 = AM.Math.Vec2d.lerp(a,b,Math.random());
     var p2 = AM.Math.Vec2d.lerp(c,d,Math.random());
     var c1 = AM.Math.Vec2d.lerp(a,mid,Math.random());
     var c2 = AM.Math.Vec2d.lerp(mid,d,Math.random());

     var color = '#'+ (Math.random().toString(16) + '000000').slice(2, 8);
     var path = "M " + p1.x + " " + p1.y + " C " + c1.x + " " + c1.y + " " + c2.x + " " + c2.y + " " +p2.x + " " + p2.y;
     this.paths.push(svg.path(path).fill('none').stroke({color:color,opacity:Math.random(),width:2}));
     }
     }*/
};

var hooks = new AM.Test();
var svg = {};
var width = 15;
AM.Load = function () {
    svg = SVG("drawing");
};