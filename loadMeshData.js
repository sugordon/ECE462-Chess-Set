function loadMeshData(string) {
    var lines = string.split("\n");
    var positions = [];
    var normals = [];
    var vertices = [];
    var normals = [];

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
                    var a = positions[parseInt(parts[1] - 1)];
                    var b = positions[parseInt(parts[2] - 1)];
                    var c = positions[parseInt(parts[3] - 1)];

                    var t1 = subtract(b, a);
                    var t2 = subtract(c, a);
                    var normal = normalize(cross(t2, t1));
                    normal = vec4(normal);
                    normal[3]  = 0.0;

                    normals.push(normal);
                    normals.push(normal);
                    normals.push(normal);

                    vertices.push(a);
                    vertices.push(b);
                    vertices.push(c);
                    break;
                }
            }
        }
    }
    var vertexCount = vertices.length;
    return {
        points: vertices,
        normals: normals,
        vertexCount: vertexCount
    };
}
