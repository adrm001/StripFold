var AM = AM || {};


AM.Test = function (){

};

AM.Test.prototype = {
  points:[],
  var2:"test",
  
  test2 : function Test$test2(){
    this.points[this.points.length] = new AM.SvgPoint(this.points[this.points.length-1]);
  },
};

AM.SvgPoint = function (prev){
  var x;
  var y;
  
  if(prev){
    x = prev.point.x + 15;
    y = prev.point.y + 15;
    this.pLine = svg.line(prev.point.x,prev.point.y,x,y).stroke({ width: 3 });
    this.ptl = svg.line(prev.point.x,prev.point.y,x,y).stroke({ width: 3 });
    this.pbl = svg.line(prev.point.x,prev.point.y,x,y).stroke({ width: 3 });    
    this.prev = prev;
	prev.next = this;
	prev.nLine = this.pLine;
  prev.ntl = this.ptl;
  prev.nbl = this.pbl;
  }
  else{
    x=50;
    y=50;
  }
  this.point = new AM.Math.Vec2d(x,y);
  this.circle = svg.circle(20).center(x,y);
  this.circle.draggable();
  this.circle.dragmove = this.dragmove.bind(this);
  this.calcFold();
};

AM.SvgPoint.prototype = {
  point:null,
  circle:null,
  pLine:null,
  prev:null,
  next:null,
  nLine:null,
  fold:null,
  fPointA:null,
  fPointB:null,
  ptl:null,
  pbl:null,
  ntl:null,
  nbl:null,
  
  dragmove: function(delta, event){
    this.point.x = this.circle.cx();
    this.point.y = this.circle.cy();
    if(this.pLine){
      var p = this.prev.point;
      this.pLine.plot(p.x,p.y,this.point.x,this.point.y);
    }
    if(this.nLine){
      var n = this.next.point;
      this.nLine.plot(this.point.x,this.point.y,n.x,n.y);
    }
    this.calcFold();
    if(this.prev){this.prev.calcFold();}
    if(this.next){this.next.calcFold();}
    this.connectFolds();
    if(this.prev){this.prev.connectFolds();}
    if(this.next){this.next.connectFolds();}
  },
  calcFold: function(){    
  if(!this.prev&&!this.next){return;}
    var angle;
    var dot;
    var dir;
    if(this.prev){
      dir = this.prev.point.subtract(this.point).norm();
    }else{
      dir = this.point.subtract(this.next.point).norm().scale(-1);
    }    
    if(this.next&&this.prev){
      var otherDir = this.next.point.subtract(this.point).norm();
      angle = (Math.PI - dir.angle(otherDir))/2;
      dot = dir.dot(otherDir);
      var cross = dir.cross(otherDir);
      if (cross>0) { angle = -angle;}
    }else{
      angle = AM.Math.ToRad(90);      
    }
    angleSpan.innerHTML = AM.Math.ToDeg(angle); 
    dotSpan.innerHTML = dot;
    var size = width/(Math.cos(AM.Math.ToRad(90) - angle));
    var folda = dir.rotate(angle).scale(size);
    var foldb = dir.rotate(angle).scale(-size);
    this.fPointA = this.point.add(folda);
    this.fPointB = this.point.add(foldb);
     
    if(this.fold){      
      this.fold.plot(this.fPointA.x,this.fPointA.y,this.fPointB.x,this.fPointB.y);
    }else{
      this.fold = svg.line(this.fPointA.x,this.fPointA.y,this.fPointB.x,this.fPointB.y).stroke({ width: 3 });
    }
  },
  connectFolds: function(){
    var a = this.fPointA;
    var b = this.fPointB;
    if(this.prev){
      var pb = this.prev.fPointB;
      var pa = this.prev.fPointA;      
      this.ptl.plot(pb.x,pb.y,a.x,a.y);
      this.pbl.plot(pa.x,pa.y,b.x,b.y);
    }
    if(this.next){
      var nb = this.next.fPointB;
      var na = this.next.fPointA;      
      this.ntl.plot(b.x,b.y,na.x,na.y);
      this.nbl.plot(a.x,a.y,nb.x,nb.y);
    }
  }
};

AM.Segment = function(start, end){


}

var hooks = new AM.Test();
var svg = {};
var width = 15;
var angleSpan = null;
var dotSpan = null;
AM.Load = function(){
  svg = SVG("drawing");
  angleSpan = document.getElementById("angle");
  dotSpan = document.getElementById("dot");
}