function loadMeshData(string) {
    var lines = string.split("\n");
    var positions = [];
    var normals = [];
    var vertices = [];

    for ( var i = 0 ; i < lines.length ; i++ ) {
        var parts = lines[i].trimRight().split(' ');
        if ( parts.length > 0 ) {
            switch(parts[0]) {
                case 'v':  positions.push(
                    vec4(parseFloat(parts[1]),
                        parseFloat(parts[2]),
                        parseFloat(parts[3])
                    ));
                    break;
                case 'vn':
                    normals.push(
                        vec4(parseFloat(parts[1]),
                            parseFloat(parts[2]),
                            parseFloat(parts[3])
                        ));
                    break;
                case 'f': {
                    vertices.push(positions[parseInt(parts[1] - 1)]);
                    vertices.push(positions[parseInt(parts[2] - 1)]);
                    vertices.push(positions[parseInt(parts[3] - 1)]);
                    break;
                }
            }
        }
    }
    var vertexCount = vertices.length;
    return {
        primitiveType: 'TRIANGLES',
        points: vertices,
        vertexCount: vertexCount
    };
}
