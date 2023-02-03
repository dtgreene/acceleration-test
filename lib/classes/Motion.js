export class MotionVertex {
  x = 0;
  y = 0;
  d = 0;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

export class MotionPath {
  vertices = [];
  constructor(path) {
    for (let i = 0; i < path.length; i += 2) {
      const x = path[i];
      const y = path[i + 1];
      const vertex = new MotionVertex(x, y);

      // try to get the distance to the next vertex
      if (path[i + 2] && path[i + 3]) {
        vertex.d = distanceTo(x, y, path[i + 2], path[i + 3]);
      }

      this.vertices.push(vertex);
    }

    for (let i = 0; i < this.vertices.length; i++) {
      let index = 0;
      let distance = 0;
      let angles = [];

      // Look ahead a certain distance and consecutively evaluate vertices
      // as groups of three.

      // Essentially create a triangle out of the three vertices and find the
      // angle between the first and last vertices.

      while (distance < 10) {
        // the three vertices being evaluated
        const aVertex = this.vertices[i + index];
        const bVertex = this.vertices[i + index + 1];
        const cVertex = this.vertices[i + index + 2];

        if (!aVertex || !bVertex || !cVertex) break;

        const a = aVertex.d;
        const b = bVertex.d;
        const c = distanceTo(aVertex.x, aVertex.y, cVertex.x, cVertex.y);

        const cCosine = (a ** 2 + b ** 2 - c ** 2) / (2 * a * b);
        const angleC = Math.acos(cCosine);

        index++;
        distance += a + b;
        angles.push(angleC);
      }

      if (angles.length > 0) {
        const mean =
          angles.reduce((acc, current) => acc + current, 0) / angles.length;

        // The starting range of the mean is between 0 and PI.

        // Subtracting the mean from PI basically gives a number showing
        // how much this future set of points curves away from being flat.

        this.vertices[i].futureMean = Math.min(Math.PI - mean, 0.08) / 0.08;
      }

      // if (angles.length > 0) {
      //   const mean =
      //     angles.reduce((acc, current) => acc + current, 0) / angles.length;
      //   const variance =
      //     angles.reduce((acc, current) => acc + (current - mean) ** 2) /
      //     angles.length;
      //   const deviation = Math.sqrt(variance);

      //   this.vertices[i].variance = variance;
      //   this.vertices[i].deviation = deviation;
      // }
    }

    ctx.fillStyle = '#fff';
    for (let i = 0; i < this.vertices.length; i++) {
      const vertex = this.vertices[i];

      const color = vertex.futureMean * 255;
      ctx.fillStyle = `rgba(${color}, ${color}, ${color}, 1)`;

      if (vertex.futureMean > 0.4) {
        ctx.fillStyle = 'red';
      } else {
        ctx.fillStyle = '#fff';
      }

      ctx.fillRect(vertex.x, vertex.y, 2, 2);
    }
  }
}
