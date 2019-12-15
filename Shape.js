// constants
var BIG_NUMBER = 1000000;

class BoundingBox {
    constructor(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}

// abstract class
class Shape {
    constructor() {
        this.fillStyle = 'rgba(255, 255, 127, 0.6)';
        this.strokeStyle = '#000';
        this.boundingBox = new BoundingBox(0, 0, 0, 0);
    }
    update(dt) {
        throw 'Shape.update() not implemented';
    }

    boundingBox() {
        throw 'Shape.boundingBox() not implemented';
    }

    createPath(context) {
        throw 'Shape.createPath(context) not implemented';
    }

    fill(context) {
        context.save();
        context.fillStyle = this.fillStyle;
        this.createPath(context);
        context.fill();
        context.restore();
    }

    stroke(context) {
        context.save();
        ctx.lineWidth = 1;
        context.strokeStyle = this.strokeStyle;
        this.createPath(context);
        context.stroke();
        context.restore();
    }

    collideWith(shape) {
        throw 'Shape.collidesWith(shape, displacement) not implemented';
    }

    getMinMaxOnAxis(axis) {
        throw 'Shape.getMinMaxOnAxis(axis) not implemented';
    }
}

class Polygon extends Shape {
    constructor(pos, verticesRef, rotation = 0) {
        super();
        this.collisionType = 'polygon'

        this.pos = pos;
        this.rotation = rotation;

        // reference center position
        this.verticesRef = verticesRef;
        // 處理優化，盡量避免new物件
        this.vertices = [];
        this.norms = [];
        // 將重複使用的物間提出來初始化
        for (let i = 0; i < verticesRef.length; i++) {
            this.vertices.push(new Vector());
            this.norms.push(new Vector());
        }

    }
    collideWith(shape) {
        if (shape.collisionType == 'polygon') {
            return polygonCollidesWithPolygon(shape, this);
        } else {
            return polygonCollidesWithCircle(this, shape);
        }
    }
    getVertices() {
        // let vertices = [];
        // Clockwise
        for (let i = 0; i < this.verticesRef.length; i++) {
            let p1 = this.verticesRef[i];

            let vec = this.vertices[i];
            vec.x = this.pos.x + p1.x;
            vec.y = this.pos.y + p1.y;
            vec.rotateRefPoint(this.rotation, this.pos);
        }
        return this.vertices;
    }
    getNorms() {
        let vertices = this.getVertices();
        let norms = this.norms;
        let p1, p2, n;
        // Clockwise
        for (let i = 1; i < vertices.length; i++) {
            let p1 = vertices[i - 1],
                p2 = vertices[i];
            n = new Vector(p2.x - p1.x, p2.y - p1.y).normalL().normalize();
            norms[i] = n;
        }

        p1 = vertices[vertices.length - 1];
        p2 = vertices[0];
        n = new Vector(p2.x - p1.x, p2.y - p1.y).normalL().normalize();
        norms[0] = n;

        return norms;
    }
    getMinMaxOnAxis(axis) {
        let vertices = this.getVertices();

        let length_arr = vertices.map(v => v.dot(axis));

        return new Projection(Math.min(...length_arr), Math.max(...length_arr));
    }

    createPath(ctx) {
        if (this.verticesRef.length == 0) return;

        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.rotation);

        let points = this.verticesRef;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
        }
        ctx.closePath();
    }
    getBoundingBox() {
        let minx = BIG_NUMBER, miny = BIG_NUMBER,
            maxx = -BIG_NUMBER, maxy = -BIG_NUMBER;
        let vertices = this.getVertices();
        let box = this.boundingBox;
        for (let i = 0; i < vertices.length; i++) {
            const p = vertices[i];
            minx = Math.min(minx, p.x);
            miny = Math.min(miny, p.y);
            maxx = Math.max(maxx, p.x);
            maxy = Math.max(maxy, p.y);
        }
        box.left = minx;
        box.top = miny;
        box.width = parseFloat(maxx - minx);
        box.height = parseFloat(maxy - miny);
        return box;
    }
}

class Circle extends Shape {
    constructor(pos, radius, rotation = 0) {
        super();
        this.collisionType = 'circle'

        this.pos = pos;
        this.rotation = rotation;
        this.radius = radius;
    }
    collideWith(shape) {
        if (shape.collisionType == 'polygon') {
            return polygonCollidesWithCircle(shape, this);
        } else {
            return circleCollidesWithCircle(shape, this);
        }
    }
    getMinMaxOnAxis(axis) {
        let dot = this.pos.dot(axis);
        let length_arr = [dot, dot + this.radius, dot - this.radius];

        return new Projection(Math.min(...length_arr), Math.max(...length_arr));
    }

    createPath(ctx) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, false);
        ctx.closePath();
    }
    getBoundingBox() {
        this.boundingBox.left = this.pos.x - this.radius;
        this.boundingBox.top = this.pos.y - this.radius;
        this.boundingBox.width = 2 * this.radius;
        this.boundingBox.height = 2 * this.radius;
        return this.boundingBox;
    }
}

class Projection {
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    isOverlap(projection) {
        return this.max > projection.min && projection.max > this.min
    }
    getOverlap(projection) {
        if (!this.isOverlap(projection)) return 0;
        /*
        *(a.min)      *(b.min)          *(a.max)          *(b.max)
        |-------------------------------| projectionA
                      |---------------------------------  | projectionB
        */
        // when projection on left
        if (this.max > projection.max)
            return projection.max - this.min;
        else
            return this.max - projection.min;
    }
}

/**
 * 
 * @param {shape} shapeA static
 * @param {shape} shapeB 
 */
function polygonCollidesWithPolygon(polygonA, polygonB) {
    let axes = polygonA.getNorms().concat(polygonB.getNorms());
    return getMTV(polygonA, polygonB, axes);
}

/**
 * 
 * @param {shape} polygon static
 * @param {shape} circle
 */
function polygonCollidesWithCircle(polygon, circle) {
    let axes = polygon.getNorms();
    // 多加上一條，圓心到多邊型最近的頂點，連成的axis
    axes.push(getCircleAxisWithPolygon(circle, polygon));
    return getMTV(polygon, circle, axes);
}

/**
 * 
 * @param {shape} circleA static
 * @param {shape} circleB
 */
function circleCollidesWithCircle(circleA, circleB) {
    let dist = circleA.pos.clone().subtract(circleB.pos).length();
    let overlap = (circleA.radius + circleB.radius) - dist;
    let mtv = { axis: null, overlap: 0 };

    // not collision
    if (overlap < 0) {
        return { axis: null, overlap: 0 };
    }
    let axis = circleB.pos.clone().subtract(circleA.pos).normalize();
    return { axis: axis, overlap: overlap };
}

function getCircleAxisWithPolygon(circle, polygon) {
    let v1 = getPointClosestToPolygon(circle.pos, polygon);
    let axis = v1.clone().subtract(circle.pos).normalize();
    return axis;
}

function getPointClosestToPolygon(point, polygon) {
    let min = BIG_NUMBER, length, testPoint, closestPoint;
    let vertices = polygon.getVertices();

    for (var i = 0; i < vertices.length; ++i) {
        testPoint = vertices[i];
        length = Math.sqrt(Math.pow(testPoint.x - point.x, 2) + Math.pow(testPoint.y - point.y, 2));
        if (length < min) {
            min = length;
            closestPoint = testPoint;
        }
    }
    return closestPoint;
}

function getMTV(shapeA, shapeB, axes) {
    let normals = axes;

    let mtv, axisWithMinOverlap, minimumOverlap = BIG_NUMBER;
    let projectionA, projectionB, overlap;
    for (let i = 0; i < normals.length; i++) {
        let axis = normals[i];
        projectionA = shapeA.getMinMaxOnAxis(axis);
        projectionB = shapeB.getMinMaxOnAxis(axis);

        // overlap is positive
        overlap = projectionA.getOverlap(projectionB);
        // if isSeparated return
        if (overlap == 0) {
            mtv = { axis: null, overlap: 0 };
            return mtv;
        }

        // keep minimum overlap
        if (overlap < minimumOverlap) {
            minimumOverlap = overlap;
            axisWithMinOverlap = axis;
        }
    }
    mtv = {
        axis: axisWithMinOverlap,
        overlap: minimumOverlap
    };
    return mtv;
}



// 如過要分離物體
// 當物體B撞到A時，要有一個反向的MTV將它推回去，如果MTV的方向跟向量AB不同方向，導致B物體反而往A裡面推
// 這就是為什麼用dot來判斷是否相反

// 回傳的MTV是polygonB要移動的向量，所以當作用力的方向與B與A的相對位置不一致時，需做反向
// 正確的MTV是跟向量AB同方向，這樣才能正確地把B以最短距離推出A的範圍
// vec(B-A) = vecAB
function separate(shapeA, shapeB, mtv) {
    let D = new Vector(mtv.axis.x * mtv.overlap, mtv.axis.y * mtv.overlap)
    let dist = new Vector(shapeB.pos.x - shapeA.pos.x, shapeB.pos.y - shapeA.pos.y);
    if (dist.dot(D) < 0) D.multiplyScalar(-1);

    shapeB.pos.add(D)
}