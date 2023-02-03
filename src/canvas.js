// size of the canvas
export const canvasSize = 800;

// create canvas
export const canvas = document.createElement('canvas');
canvas.width = canvasSize;
canvas.height = canvasSize;

export const ctx = canvas.getContext('2d');

// create plot canvas
export const plotCanvas = document.createElement('canvas');
plotCanvas.width = canvasSize;
plotCanvas.height = canvasSize;

export const plotCtx = plotCanvas.getContext('2d');
