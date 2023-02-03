import { canvasSize, ctx, plotCtx } from '../canvas.js';
import { distanceTo } from '../utils.js';

const stepsPerMM = 40;
const millisPerFrame = (1 / 60) * 1000;

const PenState = {
  DOWN: 0,
  UP: 1,
};

export class Movement {
  xSteps = 0;
  ySteps = 0;
  duration = 0;
  callback = () => {};
  constructor(xSteps, ySteps, duration, callback) {
    this.xSteps = xSteps;
    this.ySteps = ySteps;
    this.duration = duration;
    this.callback = callback;
  }
}

export class Plotter {
  queue = [];
  currentMove = null;
  isBusy = false;
  pos = {
    x: 0,
    y: 0,
  };
  steps = {
    x: 0,
    y: 0,
  };
  initialSteps = {
    x: 0,
    y: 0,
  };
  speed = {
    x: 0,
    y: 0,
  };
  penState = PenState.UP;
  timeElapsed = 0;
  update = () => {
    // draw
    const { x, y } = this.pos;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasSize, y);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasSize);
    ctx.stroke();

    if(this.penState === PenState.DOWN) {
      plotCtx.fillStyle = '#fff';
      plotCtx.fillRect(x, y, 2, 2);
    }

    // update
    if (!this.isBusy) return;

    const { xSteps, ySteps, duration } = this.currentMove;

    this.timeElapsed += millisPerFrame;

    if (this.timeElapsed >= duration) {
      // Since this whole thing isn't perfect, just hard-code the final position
      // to prevent rounding errors from building up.
      this.steps.x = this.initialSteps.x + xSteps;
      this.steps.y = this.initialSteps.y + ySteps;

      this.currentMove.callback();

      this.currentMove = null;
      this.isBusy = false;

      this.processQueue();
    } else {
      this.steps.x += this.speed.x;
      this.steps.y += this.speed.y;
    }

    // update position
    this.pos.x = this.steps.x / stepsPerMM;
    this.pos.y = this.steps.y / stepsPerMM;
  };
  penUp = () => {
    this.penState = PenState.UP;
  };
  penDown = () => {
    this.penState = PenState.DOWN;
  };
  moveTo = (x, y, stepsPS) => {
    const x1 = x;
    const y1 = y;
    const x2 = this.pos.x;
    const y2 = this.pos.y;

    // calculate steps to take in each direction
    const deltaX = x1 - x2;
    const deltaY = y1 - y2;
    const stepsX = Math.round(deltaX * stepsPerMM);
    const stepsY = Math.round(deltaY * stepsPerMM);

    // calculate duration to travel between points
    const distance = distanceTo(x1, y1, x2, y2);
    const stepDistance = distance * stepsPerMM;
    const duration = Math.round((stepDistance / stepsPS) * 1000);

    return new Promise((resolve) =>
      this.stepperMove(stepsX, stepsY, duration, resolve)
    );
  };
  stepperMove = (xSteps, ySteps, duration, callback) => {
    this.queue.push(new Movement(xSteps, ySteps, duration, callback));

    if (!this.isBusy) {
      this.processQueue();
    }
  };
  processQueue = () => {
    if (this.isBusy) return;
    if (this.queue.length === 0) return;

    const movement = this.queue.shift();
    const { xSteps, ySteps, duration } = movement;

    this.currentMove = movement;
    this.isBusy = true;
    this.initialSteps.x = this.steps.x;
    this.initialSteps.y = this.steps.y;

    // the number of steps to take per frame
    this.speed.x = xSteps / (duration / millisPerFrame);
    this.speed.y = ySteps / (duration / millisPerFrame);

    this.timeElapsed = 0;
  };
}
