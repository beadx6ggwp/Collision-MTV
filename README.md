# Collision-MTV

Collision-MTV

線上執行 : [polygon-MTV-ver1.0-full](http://davidhsu666.com/downloads/Collision-MTV/versions/polygon-MTV-ver1.0-full/)

技術實作筆記文章 : [Click Here](http://davidhsu666.com/archives/gamecollisiondetection/)

正常的矩形碰撞+MTV.

![AllText](example1.gif)

SAT檢測+MTV

![AllText](example2.gif)

## Introduction

rect-MTV : just rectangle

polygon-MTV : simple test

polygon-MTV-show : complete

## How to use

`var shapes = [];`

建立N多邊形
```js
shapes.push(new Polygon(pos, verticesRef, rotation));
/*
 pos: Vector(x, y)
 verticesRef: [ new Vector(100, -50),
                new Vector(100, 50),
                new Vector(-100, 0)]
 rotation: 0~2pi
*/
```

建立圓形
```js
shapes.push(new Circle(pos, radius, rotation));
/*
 pos: Vector(x, y)
 radius: circle radius
 rotation: 0~2pi
*/
```

使用方式，檢測上述兩個物體

```js

let result = shapes[i].collideWith(shapes[j]);
if (result.axis) {
    // 表示碰撞成立，執行關於碰撞的邏輯
    // ...
    // 如果需要將兩物體分離，則呼叫separate
    separate(shapes[i], shapes[j], result);
}
```
