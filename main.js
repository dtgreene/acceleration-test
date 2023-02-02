// size of the canvas
const canvasSize = 800;
const canvasCenter = canvasSize * 0.5;

const TWO_PI = Math.PI * 2;

// create canvas
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

class Layer {
  paths = [];
  constructor(paths) {
    this.paths = paths;
  }
}

class Path {
  points = [];
  constructor(points) {
    this.points = points;
  }
}

class VpypeSVG {
  layers = [];
  viewBox = {
    width: 0,
    height: 0,
  };
  dimensions = {
    width: 0,
    height: 0,
  };
  constructor(id, dimensions) {
    try {
      const svg = document.getElementById(id);
      const viewBox = svg.getAttribute('viewBox');

      // parse view box
      if (viewBox) {
        const [width, height] = viewBox.split(' ').slice(2);
        this.viewBox.width = parseFloat(width);
        this.viewBox.height = parseFloat(height);
      }

      this.dimensions = dimensions;

      // each group is a separate layer
      const groups = svg.getElementsByTagName('g');

      for (let i = 0; i < groups.length; i++) {
        const paths = [];

        const polygons = groups[i].getElementsByTagName('polygon');
        const polylines = groups[i].getElementsByTagName('polyline');

        for (let j = 0; j < polygons.length; j++) {
          paths.push(new Path(this.getPolyPoints(polygons[j])));
        }
        for (let j = 0; j < polylines.length; j++) {
          paths.push(new Path(this.getPolyPoints(polylines[j])));
        }

        // add this layer
        this.layers.push(new Layer(paths));
      }

      // debug draw
      // this.draw();
    } catch (e) {
      console.error(`Could not create VpypeSVG: ${e}`);
    }
  }
  flatten = () => {
    return this.layers.reduce(
      (acc, { paths }) => acc.concat(paths.map(({ points }) => points)),
      []
    );
  };
  getPolyPoints = (shape) => {
    const points = shape.getAttribute('points');

    if (!points || points.length === 0) return [];

    return points.split(' ').reduce((acc, current) => {
      const [x, y] = current.split(',');
      const { width, height } = this.viewBox;
      return acc.concat(
        (parseFloat(x) / width) * this.dimensions.width,
        (parseFloat(y) / height) * this.dimensions.height
      );
    }, []);
  };
}

class MotionVertex {
  x = 0;
  y = 0;
  d = 0;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class MotionPath {
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

        this.vertices[i].futureMean = Math.min((Math.PI - mean), 0.08) / 0.08;
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
      ctx.fillStyle = `rgba(${color}, ${color}, ${color}, 1)`

      if (vertex.futureMean > 0.4) {
        ctx.fillStyle = 'red';
      } else {
        ctx.fillStyle = '#fff';
      }

      ctx.fillRect(vertex.x, vertex.y, 2, 2);
    }
  }
}

window.onload = () => {
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  document.body.appendChild(canvas);

  const svg = new VpypeSVG('svg-input', { width: 800, height: 800 });
  const paths = svg.flatten();
  const motionPaths = paths.map((path) => new MotionPath(path));

  // const output = document.getElementById('test-output');

  // window.addEventListener('mousemove', (event) => {
  //   const rect = canvas.getBoundingClientRect();
  //   const angle = absAngle(
  //     canvasCenter,
  //     canvasCenter,
  //     event.clientX - rect.x,
  //     event.clientY - rect.y
  //   );
  //   output.innerHTML = angle;
  // });
};

function forEachPath(layers, fn) {
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    for (let j = 0; j < layer.paths.length; j++) {
      fn(layer.paths[j]);
    }
  }
}

function percentBetween(min, max, percent) {
  return (max - min) * percent + min;
}

function distanceTo(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function easeInOutQuad(x) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function absAngle(x1, y1, x2, y2) {
  return Math.abs(Math.atan2(y2 - y1, x2 - x1));
}
