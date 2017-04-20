"use strict";

var canvas;
var gl;

var objects = [];

/*
 * Points and color array is
 * 0: board, length 36
 * 1-6: white pieces
 * 7-12: black pieces
 */
var points = [];
var normals = [];
var texture = [];
var texCoords = [];

//Global Piece Info
var pieceInfo = {};

var normalMatrix, modelMatrix, viewMatrix, projectionMatrix;
var normalMatrixLoc, modelMatrixLoc, viewMatrixLoc, projectionMatrixLoc;

var lightPosition = vec4(0.0, -1.0, 10.0, 0.0 );

var lightAmbient = vec4(0.3, 0.3, 0.3, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

//var materialAmbient = vec4( 0.99, 0.99, 0.99, 1.0 );
var materialAmbient = vec4( 0.99, 0.99, 0.99, 1.0 );
var materialDiffuse = vec4( 0.99, 0.99, 0.99, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 1000.0;

var eye = vec3(0,1,-20);
var at = add(eye, vec3(0,0,1));
var up = vec3(0.0, 1.0, 0.0);
var fovy, aspect, near, far;

var theta = 90*Math.PI/180;
var phi = 0;

var xsens = 0.1;
var ysens = 0.1;

var keysHeld = {
    w: 0,
    a: 0,
    s: 0,
    d: 0
};

initPieces();

var ambientProduct = mult(lightAmbient, materialAmbient);
var diffuseProduct = mult(lightDiffuse, materialDiffuse);
var specularProduct = mult(lightSpecular, materialSpecular);

initGame();

var moveSpeed = 0.1;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.75, 0.75, 0.75, 1.0);

    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    configureTexture(texture, 64);

    modelMatrixLoc = gl.getUniformLocation( program, "modelMatrix" );
    viewMatrixLoc = gl.getUniformLocation( program, "viewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(mat4()));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(mat4()));

    gl.uniform4fv( gl.getUniformLocation(program,
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess );

    document.addEventListener("keydown", function(event) {
        var lookSpeed = 5;
        switch (event.key) {
            case 'a':
                keysHeld.a = 1;
                break;
            case 'w':
                keysHeld.w = 1;
                break;
            case 'd':
                keysHeld.d = 1;
                break;
            case 's':
                keysHeld.s = 1;
                break;
        }
    });

    canvas.requestPointerLock = canvas.requestPointerLock ||
        canvas.mozRequestPointerLock;

    canvas.onclick = function() {
        canvas.requestPointerLock();
    }

    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

    function lockChangeAlert() {
        if (document.pointerLockElement === canvas ||
            document.mozPointerLockElement === canvas) {
            document.addEventListener("mousemove", mouseMotion, false);
        } else {
            document.removeEventListener("mousemove", mouseMotion, false);
        }
    }

    document.addEventListener("keyup", function(event) {
        var lookSpeed = 5;
        switch (event.key) {
            case 'a':
                keysHeld.a = 0;
                break;
            case 'w':
                keysHeld.w = 0;
                break;
            case 'd':
                keysHeld.d = 0;
                break;
            case 's':
                keysHeld.s = 0;
                break;
        }
    });


    function configureTexture(image, texSize) {
        if (image.length === 0) {
            return;
        }
        var texture = gl.createTexture();
        gl.activeTexture( gl.TEXTURE0 );
        gl.bindTexture( gl.TEXTURE_2D, texture );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap( gl.TEXTURE_2D );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
            gl.NEAREST_MIPMAP_LINEAR );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    }

    function rotateView(dtheta, dphi) {
        var radius = 1;
        theta += dtheta * Math.PI / 180;
        phi += dphi * Math.PI / 180;
        var dat = vec3(radius*Math.sin(theta)*Math.sin(phi),
            radius*Math.cos(theta), radius*Math.sin(theta)*Math.cos(phi));
        at = add(eye, dat);
    }
    
    //60 ticks a second
    setInterval(tick, 1000/60);
    tick();
    render();

    function mouseMotion(event) {
        rotateView(ysens*event.movementY, -xsens*event.movementX);
    }
}

function initPieces() {
    var index = 0;
    var board = createBoard();
    insertPiece(board);
    pieceInfo.board = [index, board.vertexCount];
    index += board.vertexCount;


    var pieces = [loadMeshData(pawnString()),
        loadMeshData(knightString()),
        loadMeshData(bishopString()),
        loadMeshData(rookString()),
        loadMeshData(queenString()),
        loadMeshData(kingString())];
    ["wP","wN","wB","wR","wQ","wK","bP","bN","bB","bR","bQ","bK"].forEach(function(piece, i) {
        pieceInfo[piece] = [index, pieces[i % 6].vertexCount];
        index += pieces[i % 6].vertexCount;
    });

    function insertPiece(piece) {
        points = points.concat(piece.points);
        normals = normals.concat(piece.normals);
        //colors.push(vec4(color));
        if (piece.texCoords) {
            texture = piece.texture;
            texCoords = texCoords.concat(piece.texCoords);
        } else {
            for (var i = 0; i < piece.vertexCount; i++) {
                texCoords.push(vec2(0,0));
            }
        }
    }

    var color = vec4(0.95, 0.95, 0.95, 1);
    pieces.forEach(insertPiece);
    color = vec4(0.05, 0.05, 0.05, 1);
    pieces.forEach(insertPiece);

}

function initGame() {
    for (var i = 0; i < 8; i++) {
        objects.push(new ChessPiece("wP", String.fromCharCode(i + "a".charCodeAt(0)) + '2'));
    }
    objects.push(new ChessPiece("wR", "a1"));
    objects.push(new ChessPiece("wN", "b1"));
    objects.push(new ChessPiece("wB", "c1"));
    objects.push(new ChessPiece("wQ", "d1"));
    objects.push(new ChessPiece("wK", "e1"));
    objects.push(new ChessPiece("wB", "f1"));
    objects.push(new ChessPiece("wN", "g1"));
    objects.push(new ChessPiece("wR", "h1"));

    for (var i = 0; i < 8; i++) {
        objects.push(new ChessPiece("bP", String.fromCharCode(i + "a".charCodeAt(0)) + '7'));
    }
    objects.push(new ChessPiece("bR", "a8"));
    objects.push(new ChessPiece("bN", "b8"));
    objects.push(new ChessPiece("bB", "c8"));
    objects.push(new ChessPiece("bQ", "d8"));
    objects.push(new ChessPiece("bK", "e8"));
    objects.push(new ChessPiece("bB", "f8"));
    objects.push(new ChessPiece("bN", "g8"));
    objects.push(new ChessPiece("bR", "h8"));
}

/* Piece Class
 * uid
 * isCaptured
 * position
 * color
 * pieceType
 * modelMatrix
 * drawIndex
 * drawSize
 */
function ChessPiece(pieceType, position) {
    this.pieceType = pieceType;
    this.position = position;
    this.modelMatrix = posToModelView(position);
}

function posToModelView(position) {
    var coord = [position.charCodeAt(0) - "a".charCodeAt(0), parseInt(position[1]) - 1];
    return translate(4*coord[1]-14, 0, 4*coord[0]-14);
}

//Render can be called without altering state
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    fovy = 30;
    aspect = 1024/576;
    near = 0.1;
    far = 50;
    viewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( viewMatrixLoc, false, flatten(viewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    normalMatrix = [
        vec3(viewMatrix[0][0], viewMatrix[0][1], viewMatrix[0][2]),
        vec3(viewMatrix[1][0], viewMatrix[1][1], viewMatrix[1][2]),
        vec3(viewMatrix[2][0], viewMatrix[2][1], viewMatrix[2][2])
    ];
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );

    //Draw the board
    gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(mat4()) );
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    objects.forEach(function(object) {
        var drawVals = pieceInfo[object.pieceType];
        gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(object.modelMatrix) );
        gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
        gl.drawArrays(gl.TRIANGLES, drawVals[0], drawVals[1]);
    });

    requestAnimFrame(render);
}

function handleKeys() {
    if ((keysHeld.w && keysHeld.s) || (keysHeld.a && keysHeld.d)) {
        return;
    }
    var dir1, dir2, fdir;
    if (keysHeld.w) {
        dir1 = subtract(at, eye);
        dir1[1] = 0;
    } else if (keysHeld.s) {
        dir1 = subtract(eye, at);
        dir1[1] = 0;
    }
    if (keysHeld.d) {
        dir2 = cross(subtract(at, eye), up);
        dir2[1] = 0;
    } else if (keysHeld.a) {
        dir2 = cross(subtract(eye, at), up);
        dir2[1] = 0;
    }
    if (dir1 && dir2) {
        fdir = add(dir1, dir2);
    } else {
        fdir = dir1 || dir2;
    }
    if (!fdir) {
        return;
    }
    fdir = scale(moveSpeed/length(fdir), fdir);
    eye = add(eye, fdir);
    at = add(at, fdir);
}

//Handles rotation speed
function tick() {
    handleKeys();
    //if (isTurning) {
        //turningCubes.forEach(function(cubeIndex) {
            //turnMatrix[cubeIndex] = mult(turningVec, turnMatrix[cubeIndex]);
        //});
        //turnAngle += turnSpeed;
        //if (turnAngle >= 90) {
            //checkSolved();
            //turnAngle = 0;
            //isTurning = false;
            ////if scrambling, then rotate another face
            //if (scrambleMoves != 0) {
                //turnSpeed = scrambleSpeed;
                //scrambleMoves--;
                //rotateRandomFace();
            //} else {
                //turnSpeed = normalSpeed;
                //if (scrambleButton.innerHTML == 'Stop Scramble') {
                    //scrambleButton.innerHTML = handleMoveValue(moveInput.value);
                //}
            //}
        //}
    //}
}
