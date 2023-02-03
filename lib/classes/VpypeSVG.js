export class Layer {
  paths = [];
  constructor(paths) {
    this.paths = paths;
  }
}

export class Path {
  points = [];
  constructor(points) {
    this.points = points;
  }
}

export class VpypeSVG {
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