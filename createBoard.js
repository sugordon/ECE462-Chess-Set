function createBoard() {
    var points = [];
    var normals = [];
    var texCoords = [];
    var height = 0.1;
    var side = 16;
    var texSize = 64;

    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    // Create a checkerboard pattern using floats


    var image1 = new Array()
    for (var i =0; i<texSize; i++)  image1[i] = new Array();
    for (var i =0; i<texSize; i++)
        for ( var j = 0; j < texSize; j++)
            image1[i][j] = new Float32Array(4);
    for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
        image1[i][j] = [c, c, c, 1];
    }

    // Convert floats to ubytes for texture

    var image2 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ )
        for ( var j = 0; j < texSize; j++ )
            for(var k =0; k<4; k++)
                image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];

    //_colorCube(5);
    _colorCube(4);

    return {
        points: points,
        normals: normals,
        vertexCount: points.length,
        texture: image2,
        texCoords: texCoords,
        texSize: 64
    };

    function _colorCube(cubePos) {
        _quad(1, 0, 3, 2, false); //Front
        _quad(2, 3, 7, 6, false); //Right
        _quad(3, 0, 4, 7, false); //Down
        _quad(6, 5, 1, 2, true); //Up
        _quad(4, 5, 6, 7, false); //Back
        _quad(5, 4, 0, 1, false); //Left
    }

    function _quad(a, b, c, d, isColored) {
        var vertices = [
            vec4( -side, -height,  side, 1.0 ),
            vec4( -side,  height,  side, 1.0 ),
            vec4(  side,  height,  side, 1.0 ),
            vec4(  side, -height,  side, 1.0 ),
            vec4( -side, -height, -side, 1.0 ),
            vec4( -side,  height, -side, 1.0 ),
            vec4(  side,  height, -side, 1.0 ),
            vec4(  side, -height, -side, 1.0 )
        ];

        var indices = [ a, b, c, a, c, d ];
        var coord = [ 0, 1, 2, 0, 2, 3];

        for ( var i = 0; i < indices.length; ++i ) {
            points.push(vertices[indices[i]]);
            if (isColored) {
                texCoords.push(texCoord[coord[i]]);
            } else {
                texCoords.push(texCoord[0]);
            }
        }

        var x = vertices[a];
        var y = vertices[b];
        var z = vertices[c];

        var t1 = subtract(y, x);
        var t2 = subtract(z, x);
        var normal = normalize(cross(t2, t1));
        normal = vec4(normal);
        normal[3]  = 0.0;
        normals.push(normal);
        normals.push(normal);
        normals.push(normal);

        x = vertices[a];
        y = vertices[c];
        z = vertices[d];

        t1 = subtract(y, x);
        t2 = subtract(z, x);
        normal = normalize(cross(t2, t1));
        normal = vec4(normal);
        normal[3]  = 0.0;
        normals.push(normal);
        normals.push(normal);
        normals.push(normal);
    }
}

