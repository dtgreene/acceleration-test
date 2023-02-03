import MainLoop from 'mainloop.js';

import { VpypeSVG } from './src/classes/VpypeSVG';
import { Plotter } from './src/classes/Plotter';
import { canvas, canvasSize, ctx, plotCanvas } from './src/canvas';
import rawSVG from './src/assets/test.svg?raw';

// plotter instance
const plotter = new Plotter();

window.onload = () => {
  const canvasContainer = document.getElementById('canvas-container');
  canvasContainer.style.width = `${canvasSize}px`;
  canvasContainer.style.height = `${canvasSize}px`;

  // add canvas
  canvasContainer.appendChild(canvas);
  canvasContainer.appendChild(plotCanvas);

  MainLoop.setUpdate(update).start();

  plot();
};

async function plot() {
  const svg = new VpypeSVG(rawSVG, { width: 800, height: 800 });
  const paths = svg.flatten();
  // const motionPaths = paths.map((path) => new MotionPath(path));

  // raise the pen
  plotter.penUp();

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    for (let j = 0; j < path.length; j += 2) {
      const x = path[j];
      const y = path[j + 1];

      await plotter.moveTo(x, y, 5000);

      // lower the pen after reaching the first point
      if (j === 0) {
        plotter.penDown();
      }
    }
    // raise the pen after each path
    plotter.penUp();
  }

  await plotter.moveTo(0, 0, 5000);
}

function update() {
  try {
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    plotter.update();
  } catch (e) {
    console.error(`MainLoop update failed: ${e}`);
    MainLoop.stop();
  }
}
