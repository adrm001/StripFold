AM.PaperLetter = function (svgArg, pointsArg, position, widthArg, foreColorArg, backColorArg, scale) {
    var $scale = scale || 1;
    var $svg = svgArg;
    var $width = widthArg*$scale;
    var $fore = foreColorArg;
    var $back = backColorArg;
    var $points = [];
    var $edges = [];
    var $bundles = [];
    var $center;
    var $angle;
    var $folded = true;
    var $folding = false;
    var $pos = position;
    var $$Vec2d = AM.Math.Vec2d;
    var $time = 2000;
    var $step = $time/pointsArg.length;


    //region privileged public

    this.RemoveSvg = function () {
        $edges.forEach(function (elem) {
            elem.removeSVG();
        });
        $bundles.forEach(function (elem) {
            elem.remove();
        });
    };

    this.FoldUnfold = function () {
        if($folding){return;}
        $folding = true;
        if ($folded) {
            $edges[0].rotate($center, $angle,new $$Vec2d(0,0), new $$Vec2d(0,$width));
            $edges[1].fold(Edge.unfold);
            $folded = false;
        } else {
            $edges[0].rotate($center, -$angle, new $$Vec2d(0,-$width), new $$Vec2d(0,0));
            $edges[1].fold(Edge.fold);
            $folded = true;
        }
    };

    //endregion privileged public

    //region private classes

    //region Point

    var Point = function (x, y, prev) {

        if (prev) {
            this.prev = prev;
            prev.next = this;
        }

        this.point = new $$Vec2d(x, y);
        this.calcFold();
    };
    Point.prototype = {
        point: null,
        prev: null,
        next: null,
        fold: null,
        fPointA: null,
        fPointB: null,

        dragMove: function () {
            this.calcFold();
            if (this.prev) {
                this.prev.calcFold();
            }
            if (this.next) {
                this.next.calcFold();
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
                cross = dir.cross(otherDir);
                if (cross > 0) {
                    angle = -angle;
                }
            } else {
                angle = AM.Math.ToRad(90);
            }
            var size = $width / (Math.cos(AM.Math.ToRad(90) - angle));
            var foldA = dir.rotate(angle).scale(size);
            var foldB = dir.rotate(angle).scale(-size);
            this.fPointA = this.point.add(foldA);
            this.fPointB = this.point.add(foldB);
        }
    };

    //endregion Point

    //region Edge

    var Edge = function (top, bot, prev) {
        this.top = top;
        this.bot = bot;
        this.prev = prev;
        if (prev) {
            prev.next = this;
            this.shadow = $svg.polygon(this.polyArr());
            this.poly = this.shadow.clone();
            this.shadow.filter(function (add) {
                add.offset(0, 0).in(add.sourceAlpha).gaussianBlur(2);
            });

            this.z = prev.z + 1;
            this.zIndex = this.z;
            this.sideUp = !prev.sideUp;
            this.colorPoly();
        }
        this.line = new AM.Math.Line(top, bot);
        this.zIndex = this.z;
    };
    Edge.unfold = function (edge) {
        if (edge.zIndex >= 0) {
            edge.zIndex = -(edge.zIndex - 1);
        }
        else if (edge.zIndex < 0) {
            edge.zIndex = -(edge.zIndex + 1);
        }
    };
    Edge.fold = function (edge) {
        edge.zIndex++;
    };
    Edge.prototype = {
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
                this.poly.fill($fore);
                this.poly.stroke($fore);
            }
            else {
                this.poly.fill($back);
                this.poly.stroke($back);
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
            var dir = new $$Vec2d(Math.cos(AM.Math.ToRad(dirAngle)),Math.sin(AM.Math.ToRad(dirAngle)));
            var center = $$Vec2d.lerp(this.top, this.bot, .5);
            var dest = $$Vec2d.lerp(this.next.top, this.next.bot, .5);
            var toDes = dest.subtract(center).norm();
            var angle = toDes.angle(dir);
            var cross = toDes.cross(dir);
            if (cross < 0) {
                angle = -angle;
            }
            return {center: center, angle: angle};
        },
        rotate: function (center, angle, pre, post) {

            this.top = this.top.add(pre).subtract(center).rotate(angle).add(center).add(post);
            this.bot = this.bot.add(pre).subtract(center).rotate(angle).add(center).add(post);
            this.line = new AM.Math.Line(this.top, this.bot);
            if (this.poly) {
                this.shadow.animate($step).plot(this.polyArr());
                this.poly.animate($step).plot(this.polyArr());
            }
            if (this.next) {
                this.next.rotate(center, angle, pre, post);
            }
        },
        fold: function (zFunc, line, cb) {
            if (line) {
                var topVec = line.vector2LineFromPoint(this.top).scale(2);
                var botVec = line.vector2LineFromPoint(this.bot).scale(2);
                this.top = this.top.add(topVec);
                this.bot = this.bot.add(botVec);
                this.line = new AM.Math.Line(this.top, this.bot);
                var flipped = false;
                this.shadow.animate($step).plot(this.polyArr());
                this.poly.animate($step).plot(this.polyArr()).during(function (pos) {
                    if (pos >= .5 && !flipped) {
                        flipped = true;
                        this.sideUp = !this.sideUp;
                        zFunc(this);
                        this.colorPoly();
                        if (!this.next) {
                            arrange();
                        }
                    }
                }.bind(this)).after(function () {
                    if (!this.next && cb) {
                        cb();
                    }
                }.bind(this));
            }
            else {
                if(!this.next){//done with fold/unfold
                   $folding=false;
                }
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

    //endregion Edge

    //endregion private classes

    //region private functions

    //create array of points from list of vec2d input
    function initPoints() {
        var prev = null;
        for (var i = 0; i < pointsArg.length; i++) {
            var x = pointsArg[i].x;
            var y = pointsArg[i].y;
            prev = new Point((x + $pos.x)*$scale, (y+ $pos.y)*$scale, prev);
            $points.push(prev);
        }
        $points.forEach(function ($p) {
            $p.calcFold();
        });
    }

    function makeBundle() {

        var pairs = [];
        var firstPair;
        var secondPair;
        for (var i = 0; i < $edges.length; i++) {
            firstPair = null;
            secondPair = null;
            if (i === 0 || i === ($edges.length - 1)) {
                firstPair = {a: $edges[i].top, b: $edges[i].bot, w: (Math.random() * .6)};
            } else {
                var p = $edges[i - 1];
                var n = $edges[i + 1];
                var e = $edges[i];
                var c1 = AM.Math.Line.Intersection(e.top, n.bot, e.bot, p.top);
                var c2 = AM.Math.Line.Intersection(e.top, p.bot, e.bot, n.top);
                if(c1&&c2) {
                    var d1 = c1.subtract(p.center()).magnitude();
                    var d2 = c2.subtract(p.center()).magnitude();
                    if (d1 <= d2) {
                        firstPair = {a: e.top, b: c1, w: (Math.random() * .6)};
                        secondPair = {a: e.bot, b: c1, w: (Math.random() * .6)};
                    } else {
                        firstPair = {a: e.bot, b: c2, w: (Math.random() * .6)};
                        secondPair = {a: e.top, b: c2, w: (Math.random() * .6)};
                    }
                }else{
                    firstPair = {a: $edges[i].top, b: $edges[i].bot, w: (Math.random() * .6)};
                }
            }
            pairs.push(firstPair);
            if (secondPair) {
                pairs.push(secondPair);
            }
        }

        for (var num = 0; num < 5; num++) {
            var cPoints = [];
            for (i = 0; i < pairs.length; i++) {
                cPoints.push($$Vec2d.lerp(pairs[i].a, pairs[i].b, Math.random() * .5 + .25));
                if (i === 0) {
                    cPoints.push(cPoints[0]);
                }
                if (i === pairs.length - 1) {
                    cPoints.push(cPoints[cPoints.length - 1]);
                }
            }
            var pStr = "";
            pStr += "M " + cPoints[0].x + " " + cPoints[0].y;
            for (i = 1; i < cPoints.length - 2; i++) {
                var c1 = cPoints[i + 1].subtract(cPoints[i - 1]).norm().scale(10);
                var c2 = cPoints[i].subtract(cPoints[i + 2]).norm().scale(10);
                var p2 = cPoints[i + 1];
                c1 = c1.add(cPoints[i]);
                c2 = c2.add(cPoints[i + 1]);
                pStr += " C " + c1.x + " " + c1.y + " " + c2.x + " " + c2.y + " " + p2.x + " " + p2.y;
            }
            var color = '#' + (Math.random().toString(16) + '000000').slice(2, 8);
            $bundles.push($svg.path(pStr).fill('none').stroke({color: $fore, opacity: .4, width: 3}).back());
        }
    }

    function createStrip() {
        var prev = null;
        $points.forEach(function (elem) {
            $edges[$edges.length] = new Edge(elem.fPointA, elem.fPointB, prev);
            prev = $edges[$edges.length - 1];
        }, this);
        this.foldIndex = 0;
        var ret = $edges[0].straighten(0);
        $center = ret.center;
        $angle = ret.angle;
    }

    function arrange() {
        var min = 1000000;
        var col = [];
        $edges.forEach(function (e) {
            min = e.zIndex < min ? e.zIndex : min
        });
        for (var i = 1; i < $edges.length; i++) {
            var e = $edges[i];
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

    //endregion private functions

    //region 'constructor'

    initPoints();
    createStrip();
    makeBundle();

    //endregion 'constructor'
};
