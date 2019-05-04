var cnavas,
    ctx,
    width,
    height;
var animation,
    lastTime = 0,
    Timesub = 0, // delta Time
    DeltaTime = 0,
    loop = true;
var ctx_font = "Consolas",
    ctx_fontsize = 10,
    ctx_backColor = "#777";

window.onload = function () {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    document.addEventListener("mousedown", mousedown, false);
    document.addEventListener("mouseup", mouseup, false);
    document.addEventListener("mousemove", mousemove, false);

    main();
}

// mouse
var mousePos, isDown = false;
var mouseCheck;

var dragPoint, offSet;
var slide = {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    startTime: 0,
    endTime: 0,
    getDeltaVel: function (max, friction) {
        let vec = new Vector(this.end.x - this.start.x,
            this.end.y - this.start.y);
        let dt = (this.endTime - this.startTime) / 1000
        vec.divideScalar(dt / (friction || 1));
        if (vec.lengthSq() > max * max && max) vec.setLength(max);
        return vec;
    }
};

// shaped
var shapes = [], num = 10;

var polygon_data = [];
// 3
polygon_data.push([
    new Vector(100, -50),
    new Vector(100, 50),
    new Vector(-100, 0)]);
// 4
polygon_data.push([
    new Vector(50, -100),
    new Vector(50, 100),
    new Vector(-50, 100),
    new Vector(-50, -100)
]);
// 5
polygon_data.push([
    new Vector(0, -100),
    new Vector(100, 0),
    new Vector(0, 100),
    new Vector(-100, 100),
    new Vector(-100, -100)]);
// 6
polygon_data.push([
    new Vector(50, -50),
    new Vector(100, 0),
    new Vector(50, 50),
    new Vector(-50, 50),
    new Vector(-100, 0),
    new Vector(-50, -50)
]);
// 7
polygon_data.push([
    new Vector(-100, -100),
    new Vector(100, 0),
    new Vector(-100, 100),
]);
// 8
polygon_data.push(createCircle(50, 10));

// 正N邊形，來模擬圓形
function createCircle(radius, side) {
    // side = radius*0.4
    side = side || radius * 0.4;
    var angle = 0;
    var add = Math.PI * 2 / side;
    var vertices = [];
    for (; angle < Math.PI * 2; angle += add) {
        vertices.push(new Vector(radius * Math.cos(angle), radius * Math.sin(angle)));
    }
    //console.log(vertices);
    return vertices;
}


function main() {
    console.log("start");
    for (let i = 0; i < num; i++) {
        let obj = new Polygon(new Vector(randomInt(0, width), randomInt(0, height)),
            polygon_data[randomInt(0, polygon_data.length - 1)]);
        obj.rotation = Math.PI * 2 * Math.random();

        shapes.push(obj);
    }

    // 真。圓形
    shapes.push(new Circle(new Vector(randomInt(0, width), randomInt(0, height)), 50));
    shapes.push(new Circle(new Vector(randomInt(0, width), randomInt(0, height)), 30));


    window.requestAnimationFrame(mainLoop);
    //mainLoop();
}


function update(dt) {
    for (let i = 0; i < shapes.length; i++) {
        let isBoom = 0;
        for (let j = 0; j < shapes.length; j++) {
            if (i == j) continue;
            let result = shapes[i].collideWith(shapes[j]);
            if (result.axis) {
                // console.log(i, result)
                separate(shapes[i], shapes[j], result);
                // isBoom = 1;
            }

        }
        if (isBoom) shapes[i].fillStyle = "rgba(255, 125, 125, 0.5)";
        else shapes[i].fillStyle = "rgba(255, 255, 255, 1)";
    }
    // if (dragPoint) {
    //     for (let i = 0; i < shapes.length; i++) {
    //         let isBoom = 0;
    //         if (dragPoint == shapes[i]) continue;
    //         // debugger
    //         let result = dragPoint.collideWith(shapes[i]);
    //         if (result.axis) {
    //             // console.log(i, result)
    //             separate(dragPoint, shapes[i], result)
    //             isBoom = 1;
    //         }
    //         if (isBoom) shapes[i].fillStyle = "rgba(255, 125, 125, 0.5)";
    //         else shapes[i].fillStyle = "rgba(255, 255, 255, 1)";
    //     }
    // }
}

function draw(ctx) {
    for (let i = 0; i < shapes.length; i++) {
        let obj = shapes[i];
        ctx.save();

        if (isDown && obj === dragPoint) {
            ctx.shadowColor = "#000";
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;
            ctx.shadowBlur = 8;
        }

        obj.fill(ctx);
        obj.stroke(ctx);
        drawString(ctx, i + "",
            obj.pos.x, obj.pos.y,
            "#000", 10, "consolas",
            0, 0, 0);

        ctx.restore();
    }
    if (dragPoint) {
        // let testObj = jsonCopy(dragPoint);
        // debugger
        let testObj = dragPoint;
        let originPos = testObj.pos.clone();
        testObj.fillStyle = "rgba(255,127,127,0.3)";
        // mousePos - offSet :還原物體中心
        testObj.pos = new Vector(mousePos.x - offSet.x, mousePos.y - offSet.y);
        testObj.fill(ctx);
        testObj.stroke(ctx);
        testObj.pos = originPos;
    }
}
function jsonCopy(src) {
    return JSON.parse(JSON.stringify(src));
}

function mainLoop(timestamp) {
    Timesub = timestamp - lastTime;// get sleep
    DeltaTime = Timesub / 1000;
    lastTime = timestamp;
    //Clear
    ctx.fillStyle = ctx_backColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //--------Begin-----------    
    if (isDown && dragPoint) {
        // update slide status
        slide.start = mousePos;
        slide.startTime = getNow();

        // update dragPoint position
        dragPoint.pos.x = mousePos.x - offSet.x;
        dragPoint.pos.y = mousePos.y - offSet.y;
    }

    if (!isDown && dragPoint) {
        slide.end = mousePos;
        slide.endTime = getNow();
        //dragPoint.vel = slide.getDeltaVel(0, 0.3);
        dragPoint = null;
        // clear dragPoint
    }

    update(DeltaTime);
    draw(ctx);

    //--------End---------------
    let str1 = "Fps: " + 1000 / Timesub, str2 = "Timesub: " + Timesub, str3 = "DeltaTime: " + DeltaTime;
    drawString(ctx, str1 + "\n" + str2 + "\n" + str3,
        0, height - 31,
        "#FFF", 10, "consolas",
        0, 0, 0);
    if (loop) {
        animation = window.requestAnimationFrame(mainLoop);
    } else {
        // over
    }
}

function mousedown(e) {
    isDown = true;
    dragPoint = findDragPoint(e.clientX - canvas.offsetLeft,
        e.clientY - canvas.offsetTop);
    if (dragPoint) {
        offSet = {
            x: mousePos.x - dragPoint.pos.x,
            y: mousePos.y - dragPoint.pos.y
        };
        let index = shapes.indexOf(dragPoint);
        shapes.push(shapes[index]);
        shapes.splice(index, 1);
    }
}

function mouseup(e) {
    isDown = false;
}

function mousemove(e) {
    mousePos = { x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop };
}

function findDragPoint(x, y) {
    mouseCheck = new Polygon(new Vector(x, y), [
        new Vector(0, 0), new Vector(1, 0), new Vector(0, 1), new Vector(1, 1)
    ]);
    for (let i = 0; i < shapes.length; i++) {
        let shape = shapes[i];


        // if (shape.isPointInPath(ctx, x, y)) return shapes[i];
        let sat = mouseCheck.collideWith(shape);
        if (sat.axis) return shape;
    }
    return null;
}
//--------object-------------



// ----tool-------
function drawCircle(x, y, r, side) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
    if (side) ctx.stroke();
}
function toRadio(angle) {
    return angle * Math.PI / 180;
}
function toDegree(angle) {
    return angle * 180 / Math.PI;
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function random(min, max) {
    return Math.random() * (max - min) + min;
}
function getNow() {
    return new Date().getTime();
}