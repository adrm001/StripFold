AM.Math = AM.Math || {};

AM.Math.ToDeg = function(rad){
  return rad*(180/Math.PI);
};
AM.Math.ToRad = function(deg){
  return deg*(Math.PI/180);
};
AM.Math.Vec2d = function (x,y){
  this.x = x;
  this.y = y;
};

AM.Math.Vec2d.prototype={
  x:0,
  y:0,
  
  subtract: function(otherVec){
    return new AM.Math.Vec2d(this.x-otherVec.x, this.y-otherVec.y);
  },
  add: function(otherVec){
    return new AM.Math.Vec2d(this.x+otherVec.x, this.y+otherVec.y);
  },
  scale: function(num){
    return new AM.Math.Vec2d(this.x*num, this.y*num);
  },
  dot: function Vec2d$dot(otherVec){
    return this.x*otherVec.x + this.y*otherVec.y;
  },
  magnitde: function Vec2d$magnitude(){
    return Math.sqrt(this.dot(this));
  },
  norm: function Vec2d$norm(){
    var mag = this.magnitde();
    return new AM.Math.Vec2d(this.x/mag,this.y/mag);
  },
  angle: function Vec2d$angle(other){
    var dot = this.dot(other)
    var angle = Math.acos(dot);
    if(angle > Math.PI) { angle = Math.PI*2 - angle;}
    return angle;
  },
  rotate: function Vec2d$rotate(rads){
    var cos = Math.cos(rads);
    var sin = Math.sin(rads);
    
    var x = this.x*cos - this.y*sin;
    var y = this.x*sin + this.y*cos;
    return new AM.Math.Vec2d(x,y);
  },
  cross: function (otherVec){
    return this.x*otherVec.y - this.y*otherVec.x;
  }
};