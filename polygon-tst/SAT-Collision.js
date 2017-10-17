// SAT-Collision.js
function SAT_Collision(polygonA, polygonB) {
    // Get the normal vector on the edge of the polygon(left norm), return Array
    let normal_polygonA = polygonA.getNorm(),
        normal_polygonB = polygonB.getNorm();
    // merge normal_polygonA and normal_polygonB
    let normals = [];
    normals = normals.concat(normal_polygonA,normal_polygonB);
    // Get the vertex array of polygons, return Array
    let vertices_polygonA = polygonA.getVertices(),
        vertices_polygonB = polygonB.getVertices();

    let isSeparated = false;

    // use polygonA normals to evaluate
    for (let i = 0; i < normals.length; i++) {
        let minMax_A = getMinMax(vertices_polygonA, normals[i]),
            minMax_B = getMinMax(vertices_polygonB, normals[i]);

        isSeparated = (minMax_B.min > minMax_A.max || minMax_A.min > minMax_B.max);

        if (isSeparated) break;
    }
    
    // isSeparated = true:Separated boxes, false:Collided boxes
    return !isSeparated;
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