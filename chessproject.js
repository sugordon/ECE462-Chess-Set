"use strict";

var canvas;
var gl;
var nBuffer, vBuffer, tBuffer;

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

var modelMatrix, viewMatrix, projectionMatrix;
var modelMatrixLoc, viewMatrixLoc, projectionMatrixLoc;

var ambientProductLoc, diffuseProductLoc, specularProductLoc;

var lightPosition, lightPositionLoc;

var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

//var materialAmbient = vec4( 0.99, 0.99, 0.99, 1.0 );
var materialAmbient = vec4( 0.99, 0.99, 0.99, 1.0 );
var materialDiffuse = vec4( 0.99, 0.99, 0.99, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 10.0;

var eye = vec3(0,1,0);
var at = add(eye, vec3(0,0,1));
var up = vec3(0.0, 1.0, 0.0);

var theta = 90*Math.PI/180;
var phi = 0;

var xsens = 0.1;
var ysens = 0.1;

var boardAmbientProduct;
var boardDiffuseProduct;
var boardSpecularProduct;

var keysHeld = {
    w: 0,
    a: 0,
    s: 0,
    d: 0
};
var moveSpeed = 0.1;
var currPos = [0, 0];
var isMovingPiece = false;
var movingPiece;

window.onload = function init() {

    var qualityVal = document.getElementById("quality").value;
    initPieces(qualityVal);

    initGame();

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.75, 0.75, 0.75, 1.0);

    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    configureTexture(texture, 64);

    modelMatrixLoc = gl.getUniformLocation( program, "modelMatrix" );
    viewMatrixLoc = gl.getUniformLocation( program, "viewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(mat4()));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(mat4()));

    ambientProductLoc = gl.getUniformLocation(program, "ambientProduct");
    diffuseProductLoc = gl.getUniformLocation(program, "diffuseProduct");
    specularProductLoc = gl.getUniformLocation(program, "specularProduct");

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    changeLighting();

    lightPositionLoc = gl.getUniformLocation(program, "lightPosition");

    gl.uniform4fv(lightPositionLoc,flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess );

    document.addEventListener("keydown", function(event) {
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
            case ' ':
                if (isMovingPiece) {
                    jumpDown();
                } else {
                    jumpIntoPiece();
                }
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
        dtheta *= Math.PI/180;
        theta += dtheta;
        if (theta > Math.PI) {
            theta -= dtheta;
        } else if (theta < 0) { //0 breaks for some reason
            theta -= dtheta;
        }
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

function jumpDown() {
    var dir = vec3(0, -eye[1] + 1, 0);
    eye = add(eye, dir);
    at = add(at, dir);
    var transformedPos = [Math.round((currPos[1]+14)/4), Math.round((currPos[0]+14)/4)];
    if (transformedPos[0] > 7 || transformedPos[0] < 0 || transformedPos[1] > 7 || transformedPos[1] < 0) {
        transformedPos = captureLoc(movingPiece);
    }
    var landingPiece = closestPiece(transformedPos);
    if (landingPiece) {
        movePieceToLoc(landingPiece, captureLoc(landingPiece));
    }
    movePieceToLoc(movingPiece, transformedPos);
    isMovingPiece = false;
}

function movePieceToLoc(piece, loc) {
    piece.modelMatrix = translate(4*loc[1]-14, 0, 4*loc[0]-14);
    piece.position = loc;
}

function captureLoc(piece) {
    var transformedPos = [];
    if (piece.pieceType[0] === 'b') {
        transformedPos.push(piece.startingPos[0]);
        transformedPos.push(5 - piece.startingPos[1]);
    } else {
        transformedPos.push(piece.startingPos[0]);
        transformedPos.push(9 - piece.startingPos[1]);
    }
    return transformedPos;
}

function jumpIntoPiece() {
    var transformedPos = [Math.round((currPos[1]+14)/4), Math.round((currPos[0]+14)/4)];
    movingPiece = closestPiece(transformedPos);
    if (!movingPiece)  return;
    var atDir = subtract(at, eye);
    eye = vec3(4*transformedPos[1]-14, movingPiece.height, 4*transformedPos[0]-14);
    at = add(eye, atDir);
    currPos[0] = 4*transformedPos[1]-14;
    currPos[1] = 4*transformedPos[0]-14;
    isMovingPiece = true;
}

function closestPiece(transformedPos) {
    var ret;
    objects.forEach(function(obj) {
        if (transformedPos[0] == obj.position[0] && transformedPos[1] == obj.position[1]) {
            ret = obj;
        }
    });
    return ret;
}

function applyQuality() {
    var qualityVal = document.getElementById("quality").value;
    initPieces(qualityVal);

    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );
}

function initPieces(qualityVal) {
    points = [];
    normals = [];
    texCoords = [];
    var index = 0;
    var board = createBoard();
    insertPiece(board);
    pieceInfo.board = [index, board.vertexCount];
    index += board.vertexCount;

    //var color = vec4(220/255, 181/255, 150/255);
    var color = vec4(220/255, 181/255, 121/255);
    boardAmbientProduct = color;
    boardDiffuseProduct = vec4();
    boardSpecularProduct = vec4();

    var pieces = [loadMeshData(pawnString(qualityVal)),
        loadMeshData(knightString(qualityVal)),
        loadMeshData(bishopString(qualityVal)),
        loadMeshData(rookString(qualityVal)),
        loadMeshData(queenString(qualityVal)),
        loadMeshData(kingString(qualityVal))];
    ["wP","wN","wB","wR","wQ","wK","bP","bN","bB","bR","bQ","bK"].forEach(function(piece, i) {
        pieceInfo[piece] = [index, pieces[i % 6].vertexCount];
        index += pieces[i % 6].vertexCount;
        if (piece == "wK") {
            index = board.vertexCount;
        }
    });

    function insertPiece(piece) {
        points = points.concat(piece.points);
        normals = normals.concat(piece.normals);
        if (piece.texCoords) {
            texture = piece.texture;
            texCoords = texCoords.concat(piece.texCoords);
        } else {
            for (var i = 0; i < piece.vertexCount; i++) {
                texCoords.push(vec2(0,0));
            }
        }
    }

    pieces.forEach(insertPiece);
}

function initGame() {
    for (var i = 0; i < 8; i++) {
        objects.push(new ChessPiece("wP", [i, 1]));
    }
    objects.push(new ChessPiece("wR", [0, 0]));
    objects.push(new ChessPiece("wN", [1, 0]));
    objects.push(new ChessPiece("wB", [2, 0]));
    objects.push(new ChessPiece("wQ", [3, 0]));
    objects.push(new ChessPiece("wK", [4, 0]));
    objects.push(new ChessPiece("wB", [5, 0]));
    objects.push(new ChessPiece("wN", [6, 0]));
    objects.push(new ChessPiece("wR", [7, 0]));

    for (var i = 0; i < 8; i++) {
        objects.push(new ChessPiece("bP", [i, 6]));
    }
    objects.push(new ChessPiece("bR", [0, 7]));
    objects.push(new ChessPiece("bN", [1, 7]));
    objects.push(new ChessPiece("bB", [2, 7]));
    objects.push(new ChessPiece("bQ", [3, 7]));
    objects.push(new ChessPiece("bK", [4, 7]));
    objects.push(new ChessPiece("bB", [5, 7]));
    objects.push(new ChessPiece("bN", [6, 7]));
    objects.push(new ChessPiece("bR", [7, 7]));
}

function ChessPiece(pieceType, position) {
    this.pieceType = pieceType;
    this.position = position;
    this.startingPos = position;
    this.modelMatrix = mat4();
    switch(pieceType[1]) {
        case 'K':
            this.height = 6;
            this.modelMatrix = rotateY(90);
            break;
        case 'Q':
            this.height = 6;
            break;
        case 'R':
            this.height = 5;
            break;
        case 'B':
            this.height = 6;
            break;
        case 'N':
            this.height = 5;
            break;
        case 'P':
            this.height = 5;
            break;
    }
    this.modelMatrix = mult(posToModelView(position), this.modelMatrix);
    this.ambient;
    this.diffuse;
    var color;
    if (pieceType[0] == 'w') {
        color = vec4(182/255, 155/255, 76/255, 1);
    } else {
        color = vec4(70/255, 31/255, 0/255, 1);
        this.modelMatrix = mult(this.modelMatrix, rotateY(180));
    }
    this.ambient = mult(lightAmbient, color);
    this.diffuse = mult(lightDiffuse, color);
    this.specular = mult(lightSpecular, color);
}

function posToCoord(position) {
    return [position.charCodeAt(0) - "a".charCodeAt(0), parseInt(position[1]) - 1];
}

function posToModelView(coord) {
    return translate(4*coord[1]-14, 0, 4*coord[0]-14);
}

function changeLighting() {
    var lightTheta = document.getElementById('lighting').value*Math.PI/180;
    lightPosition = vec4(0.0, -Math.cos(lightTheta), -Math.sin(lightTheta), 0.0 );

    gl.uniform4fv(lightPositionLoc,flatten(lightPosition));
}

//Render can be called without altering state
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var fovy = 30;
    var aspect = 1024/567;
    var near = 0.1;
    var far = 50;
    viewMatrix = lookAt(eye, at , up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv( viewMatrixLoc, false, flatten(viewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    //Draw the board
    gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(mat4()) );

    gl.uniform4fv(ambientProductLoc, flatten(boardAmbientProduct));
    gl.uniform4fv(diffuseProductLoc, flatten(boardDiffuseProduct) );
    gl.uniform4fv(specularProductLoc, flatten(boardSpecularProduct) );

    gl.drawArrays(gl.TRIANGLES, 0, 36);

    objects.forEach(function(object) {
        gl.uniform4fv(ambientProductLoc, flatten(object.ambient));
        gl.uniform4fv(diffuseProductLoc, flatten(object.diffuse));
        gl.uniform4fv(specularProductLoc, flatten(object.specular));

        var drawVals = pieceInfo[object.pieceType];
        gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(object.modelMatrix) );
        gl.drawArrays(gl.TRIANGLES, drawVals[0], drawVals[1]);
    });

    requestAnimFrame(render);
}

function handleKeys() {
    if ((keysHeld.w && keysHeld.s) || (keysHeld.a && keysHeld.d) ||
        (!keysHeld.w && !keysHeld.s && !keysHeld.a && !keysHeld.d)) {
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
    if (Math.abs(currPos[0] + fdir[0]) > 24) {
        fdir[0] = 0;
    }
    if (Math.abs(currPos[1] + fdir[2]) > 24) {
        fdir[2] = 0;
    }
    currPos[0] += fdir[0];
    currPos[1] += fdir[2];
    eye = add(eye, fdir);
    at = add(at, fdir);
    if (isMovingPiece) {
        movingPiece.modelMatrix = mult(movingPiece.modelMatrix, translate(fdir[0], fdir[1], fdir[2]));
    }
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
