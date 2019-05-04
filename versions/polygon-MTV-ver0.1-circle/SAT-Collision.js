// SAT-Collision.js
function SAT_Collision(polygonA, polygonB) {// 以polygonA為基準
    // Get the normal vector on the edge of the polygon(left norm), return Array
    let normal_polygonA = polygonA.getNorm(),
        normal_polygonB = polygonB.getNorm();
    // merge normal_polygonA and normal_polygonB
    let normals = [];
    normals = normals.concat(normal_polygonA, normal_polygonB);
    // Get the vertex array of polygons, return Array
    let vertices_polygonA = polygonA.getVertices(),
        vertices_polygonB = polygonB.getVertices();

    let isSeparated = false;

    let MTV = new Vector(9000, 9000);
    // use polygonA normals to evaluate
    for (let i = 0; i < normals.length; i++) {
        // let minMax_A = getMinMax_ProjectLength(vertices_polygonA, normals[i]),
        //     minMax_B = getMinMax_ProjectLength(vertices_polygonB, normals[i]);
        // 如果norm已經是單位法向量，那直接dot就相當於 r*cos(theta)
        let minMax_A = getMinMax(vertices_polygonA, normals[i]),
            minMax_B = getMinMax(vertices_polygonB, normals[i]);

        isSeparated = (minMax_B.min > minMax_A.max || minMax_A.min > minMax_B.max);
        if (isSeparated) break;

        // 因為我們需要的是兩物體間的最短推出距離，但只取一個D1的話可能取到兩個最遠的角落
        /*
        如以下範例 * 四個點為兩物體的最大最小投影

        *(a.min)      *(b.min)          *(a.max)          *(b.max)
                       <-----------------> is d1
        <--------------------------------------------------------> is d2
        we need d1, not d2
        */
        let d1 = minMax_A.max - minMax_B.min;
        let d2 = minMax_B.max - minMax_A.min;
        let overlap = d1 < d2 ? d1 : d2;
        // 在A物體的軸上跟在B物體軸上的運算overlap會差一個負號
        if (Math.abs(overlap) < MTV.length()) {
            let n = normals[i].clone().norm();
            MTV = n.multiplyScalar(overlap);
        }
    }
    // 在最後判斷這個是以哪個物體的分離軸為準，如果dot值為負代表方向相反了
    // 因為D的意思是向量AB(以A為基準)

    // 當物體B撞到A時，要有一個反向的MTV將它推回去，但有時MTV的方向會跟向量AB不同方向，導致B物體反而往A裡面推
    // 這就是為什麼用dot來判斷是否相反

    // 回傳的MTV是polygonB要移動的向量，所以當作用力的方向與B與A的相對位置不一致時，需做反向
    // 正確的MTV是跟向量AB同方向，這樣才能正確地把B以最短距離推出A的範圍
    // vec(B-A) = vecAB
    let D = new Vector(polygonB.pos.x - polygonA.pos.x, polygonB.pos.y - polygonA.pos.y);
    if (MTV.dot(D) < 0) MTV.multiplyScalar(-1);

    // isSeparated = true:Separated boxes, false:Collided boxes

    return { isCollided: !isSeparated, mtv: MTV };
}

function getMinMax(vertices, axis) {
    let min_DotProduct = vertices[0].dot(axis),
        max_DotProduct = vertices[0].dot(axis);
    let min_index = 0, max_index = 0;

    for (let i = 1; i < vertices.length; i++) {
        let temp = vertices[i].dot(axis);

        if (temp < min_DotProduct) {
            min_DotProduct = temp;
            min_index = i;
        }

        if (temp > max_DotProduct) {
            max_DotProduct = temp;
            max_index = i;
        }
    }

    let result = {
        min: min_DotProduct,
        max: max_DotProduct,
        minPoint: vertices[min_index],
        maxPoint: vertices[max_index]
    };
    return result;
}

function getMinMax_ProjectLength(vertices, axis) {
    let min_DotProduct = vertices[0].projectLengthOnto(axis),
        max_DotProduct = vertices[0].projectLengthOnto(axis);
    let min_index = 0, max_index = 0;

    for (let i = 1; i < vertices.length; i++) {
        let temp = vertices[i].projectLengthOnto(axis);

        if (temp < min_DotProduct) {
            min_DotProduct = temp;
            min_index = i;
        }

        if (temp > max_DotProduct) {
            max_DotProduct = temp;
            max_index = i;
        }
    }

    let result = {
        min: min_DotProduct,
        max: max_DotProduct,
        minPoint: vertices[min_index],
        maxPoint: vertices[max_index]
    };
    return result;
}