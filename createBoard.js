function createBoard() {
    var points = [];
    var colors = [];
    var texCoords = [];
    var height = 0.1;
    var side = 8;
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
        colors: colors,
        vertexCount: points.length,
        texture: image2,
        texCoords: texCoords,
        texSize: 64
    };

    function _colorCube(cubePos) {
        var cubeColors = [0, 0, 0, 0, 0, 0];
        switch (cubePos) {
            case 0:
                cubeColors = [3, 0, 0, 6, 0, 5];
                break;
            case 1:
                cubeColors = [0, 0, 0, 6, 0, 5];
                break;
            case 2:
                cubeColors = [0, 0, 0, 6, 4, 5];
                break;
            case 3:
                cubeColors = [3, 0, 0, 6, 0, 0];
                break;
            case 4:
                cubeColors = [0, 0, 0, 6, 0, 0];
                break;
            case 5:
                cubeColors = [0, 0, 0, 6, 4, 0];
                break;
            case 6:
                cubeColors = [3, 1, 0, 6, 0, 0];
                break;
            case 7:
                cubeColors = [0, 1, 0, 6, 0, 0];
                break;
            case 8:
                cubeColors = [0, 1, 0, 6, 4, 0];
                break;
            case 9:
                cubeColors = [3, 0, 0, 0, 0, 5];
                break;
            case 10:
                cubeColors = [0, 0, 0, 0, 0, 5];
                break;
            case 11:
                cubeColors = [0, 0, 0, 0, 4, 5];
                break;
            case 12:
                cubeColors = [3, 0, 0, 0, 0, 0];
                break;
            case 13:
                cubeColors = [0, 0, 0, 0, 0, 0];
                break;
            case 14:
                cubeColors = [0, 0, 0, 0, 4, 0];
                break;
            case 15:
                cubeColors = [3, 1, 0, 0, 0, 0];
                break;
            case 16:
                cubeColors = [0, 1, 0, 0, 0, 0];
                break;
            case 17:
                cubeColors = [0, 1, 0, 0, 4, 0];
                break;
            case 18:
                cubeColors = [3, 0, 2, 0, 0, 5];
                break;
            case 19:
                cubeColors = [0, 0, 2, 0, 0, 5];
                break;
            case 20:
                cubeColors = [0, 0, 2, 0, 4, 5];
                break;
            case 21:
                cubeColors = [3, 0, 2, 0, 0, 0];
                break;
            case 22:
                cubeColors = [0, 0, 2, 0, 0, 0];
                break;
            case 23:
                cubeColors = [0, 0, 2, 0, 4, 0];
                break;
            case 24:
                cubeColors = [3, 1, 2, 0, 0, 0];
                break;
            case 25:
                cubeColors = [0, 1, 2, 0, 0, 0];
                break;
            case 26:
                cubeColors = [0, 1, 2, 0, 4, 0];
                break;
        }
        _quad(1, 0, 3, 2, cubeColors[0]); //Front
        _quad(2, 3, 7, 6, cubeColors[1]); //Right
        _quad(3, 0, 4, 7, cubeColors[2]); //Down
        _quad(6, 5, 1, 2, cubeColors[3]); //Up
        _quad(4, 5, 6, 7, cubeColors[4]); //Back
        _quad(5, 4, 0, 1, cubeColors[5]); //Left
    }

    function _quad(a, b, c, d, colorIndex) {
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

        var vertexColors = [
            [0.0,       0.0,        0.0,        1.0],   // 0, black
            [196/255,   30/255,     58/255,     1.0],   // 1, red
            [255/255,   213/255,    0.0,        1.0],   // 2, yellow
            [0.0,       158/255,    96/255,     1.0],   // 3, green
            [0.0,       81/255,     186/255,    1.0],   // 4, blue
            [255/255,   88/255,     0.0,        1.0],   // 5, Orange
            [1.0,       1.0,        1.0,        1.0]    // 6, white
        ];

        var indices = [ a, b, c, a, c, d ];
        var coord = [ 0, 1, 2, 0, 2, 3];

        for ( var i = 0; i < indices.length; ++i ) {
            points.push( vertices[indices[i]] );
            colors.push(vertexColors[colorIndex]);
            texCoords.push(texCoord[coord[i]]);
        }
    }
}

