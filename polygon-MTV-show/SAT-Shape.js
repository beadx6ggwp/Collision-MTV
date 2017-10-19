var SAT = {};

function Polygon(pos, points) {
    this.pos = pos || new Vector(0, 0);
    this.corners = points;
    this.angle = 0;
};
SAT.Polygon = Polygon;

function Box(pos, w, h) {
    this.pos = pos || new Vector(0, 0);
    this.w = w || 0;
    this.h = h || 0;
};
SAT.Box = Box;

Box.prototype.toPolygon = function () {
    let pos = this.pos;
    let w = this.w;
    let h = this.h;
    let points = [
        new Vector(w / 2, -h / 2),
        new Vector(w / 2, h / 2),
        new Vector(-w / 2, h / 2),
        new Vector(-w / 2, -h / 2)
    ];
    let obj = new Polygon(pos, points);
    return obj;
};


// return Vertices array
Polygon.prototype.getVertices = function () {
    let vertices = [];
    // Clockwise
    for (let i = 0; i < this.corners.length; i++) {
        let p1 = this.corners[i];

        let vec = new Vector(this.pos.x + p1.x, this.pos.y + p1.y);
        vec.rotateRefPoint(this.angle, this.pos);

        vertices.push(vec);
    }
    return vertices;
};

// return norms array
Polygon.prototype.getNorm = function () {
    let vertices = this.getVertices();
    let norms = [];
    let p1, p2, n;
    // Clockwise
    for (let i = 1; i < vertices.length; i++) {
        let p1 = vertices[i - 1],
            p2 = vertices[i];
        n = new Vector(p2.x - p1.x, p2.y - p1.y).normalL();
        norms.push(n);
    }

    p1 = vertices[vertices.length - 1];
    p2 = vertices[0];
    n = new Vector(p2.x - p1.x, p2.y - p1.y).normalL();
    norms.push(n);

    return norms;
};

// CreateObject

function Shape(pos, speed, direction) {
    this.pos = pos || new Vector(0, 0);// center

    this.satShape = null;

    this.rotateSpeed = toRadio(0);

    this.vel = new Vector(0, 0);
    this.vel.setLength(speed);
    this.vel.setAngleDeg(direction);

    this.color = "#FFF";
}

Shape.prototype.createSAT_Polygon = function (points) {
    this.satShape = new SAT.Polygon(this.pos, points);
}
Shape.prototype.createSAT_Box = function (w, h) {
    let obj = new SAT.Box(this.pos, w, h);
    this.satShape = obj.toPolygon();
}

Shape.prototype.update = function (dt) {
    this.satShape.angle += this.rotateSpeed * dt;

    let nowSpeed = this.vel.clone();
    nowSpeed.multiplyScalar(dt);

    this.pos.add(nowSpeed);

    // check edge
    if (this.pos.x < 0 && this.vel.x <= 0) { this.vel.x *= -1; this.pos.x = 0 }
    if (this.pos.x > width && this.vel.x >= 0) { this.vel.x *= -1; this.pos.x = width }
    if (this.pos.y < 0 && this.vel.y <= 0) { this.vel.y *= -1; this.pos.y = 0 }
    if (this.pos.y > height && this.vel.y >= 0) { this.vel.y *= -1; this.pos.y = height }

}

Shape.prototype.draw = function (ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.satShape.angle);

    let points = this.satShape.corners;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.closePath();

    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.stroke();

    let dline = new Vector((points[1].x + points[0].x) / 2,
        (points[1].y + points[0].y) / 2);

    ctx.strokeStyle = "#777";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(dline.x, dline.y);
    ctx.stroke();

    ctx.restore();
}