const canvas = document.getElementById('cartesianCanvas');
const ctx = canvas.getContext('2d');

var gridSize = window.innerWidth / 20;
var pointDensity = 0.1;
var pastWidth = 0;
var pastHeight = 0;
var currentWidth = window.innerWidth;
var currentHeight = window.innerHeight;
var currentOrigin = [currentWidth / 2, currentHeight / 2];
var funToCall = [];

// variables to track rotation & mouse interaction
let rotationX = 0;
let rotationY = 0;
let isDragging = false;
let previousMousePosition = {
	x: 0,
	y: 0
};
let sphereRadius = 1; 

window.addEventListener('contextmenu', function(event) {
	event.preventDefault();
	console.log("prevented context menu !");
});


canvas.addEventListener('mousedown', (e) => {
	isDragging = true;
	previousMousePosition = {
		x: e.clientX,
		y: e.clientY
	};
});

window.addEventListener('mouseup', () => {
	isDragging = false;
});

canvas.addEventListener('mousemove', (e) => {
	if (isDragging) {
		const deltaX = e.clientX - previousMousePosition.x;
		const deltaY = e.clientY - previousMousePosition.y;

		rotationY -= deltaX * 0.005; // rotate around Y axis when moving horizontally
		rotationX -= deltaY * 0.005; // rotate around X axis when moving vertically

		previousMousePosition = {
			x: e.clientX,
			y: e.clientY
		};
	}
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();

    if (e.deltaY < 0) {
        sphereRadius += 0.1; // Zoom in
    } else {
        sphereRadius -= 0.1; // Zoom out
    }

    sphereRadius = Math.max(0.2, sphereRadius); 
    sphereRadius = Math.min(5.0, sphereRadius); 
});


function callerFunction() {
	for (let i = 0; i < funToCall.length; i++) {
		let {
			func,
			args
		} = funToCall[i];
		func(...args);
	}
}

function rotateX(point, angle) {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	const y = point.y * cos - point.z * sin;
	const z = point.y * sin + point.z * cos;
	point.y = y;
	point.z = z;
}

function rotateY(point, angle) {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	const x = point.x * cos + point.z * sin;
	const z = point.x * sin - point.z * cos;
	point.x = x;
	point.z = z;
}

function projectPoint(point) {
	const viewDistance = 3; 
	const scale = viewDistance / (viewDistance - point.z); 
	return {
		x: point.x * scale,
		y: point.y * scale
	};
}

function threeDProj(p, color) {

	if (typeof color != 'string') return

	ctx.strokeStyle = color;
	ctx.lineWidth = 2;
	ctx.beginPath();

	let firstPoint = true;
	let points = [];

	for (let theta = 0; theta <= 2 * Math.PI + 0.1; theta += 0.1) {
		const x = sphereRadius * Math.sin(p) * Math.cos(theta);
		const y = sphereRadius * Math.sin(p) * Math.sin(theta);
		const z = sphereRadius * Math.cos(p);
		points.push({
			x,
			y,
			z
		});
	}

	points.forEach(point => {
		let tempPoint = { ...point
		};
		rotateX(tempPoint, rotationX);
		rotateY(tempPoint, rotationY);

		const projected = projectPoint(tempPoint);

		let x_canvas = projected.x * gridSize + currentOrigin[0];
		let y_canvas = currentOrigin[1] - projected.y * gridSize;

		if (firstPoint) {
			ctx.moveTo(x_canvas, y_canvas);
			firstPoint = false;
		} else {
			ctx.lineTo(x_canvas, y_canvas);
		}
	});

	ctx.stroke();
}


function callMyFunction(p, color) {
  for(let i = p[0]; i < p[1]; i+=0.1){
    funToCall.push({
		  func: threeDProj,
		  args: [i, color],
		  name: 'threeDProj'
	  }); 
  }
}

callMyFunction([0,Math.PI], 'black');

function drawGizmo(originX, originY) {
    const axisLength = 1.0;
    const gizmoScale = 30;

    const axes = {
        x: { point: { x: axisLength, y: 0, z: 0 }, color: 'red' },
        y: { point: { x: 0, y: axisLength, z: 0 }, color: 'green' },
        z: { point: { x: 0, y: 0, z: axisLength }, color: 'blue' }
    };

    for (const axis in axes) {
        let tempPoint = { ...axes[axis].point };
        rotateX(tempPoint, rotationX);
        rotateY(tempPoint, rotationY);

        const projected = projectPoint(tempPoint);

        const x_canvas = projected.x * gizmoScale + originX;
        const y_canvas = originY - projected.y * gizmoScale;

        ctx.beginPath();
        ctx.strokeStyle = axes[axis].color;
        ctx.lineWidth = 3;

        ctx.moveTo(originX, originY); 
        ctx.lineTo(x_canvas, y_canvas);
        ctx.stroke();
    }
}


function renderCanvas() {
	ctx.clearRect(0, 0, currentWidth, currentHeight);
	canvas.width = currentWidth;
	canvas.height = currentHeight;
	const canvasWidth = canvas.width;
	const canvasHeight = canvas.height;

	ctx.strokeStyle = 'grey';
	ctx.lineWidth = 1;

	const originX = currentOrigin[0];
	const originY = currentOrigin[1];

	for (let i = 0; i <= originX; i += gridSize) {
		ctx.beginPath();
		ctx.moveTo(originX + i, 0);
		ctx.lineTo(originX + i, canvasHeight);
		ctx.stroke();

		if (i > 0) {
			ctx.beginPath();
			ctx.moveTo(originX - i, 0);
			ctx.lineTo(originX - i, canvasHeight);
			ctx.stroke();
		}
	}

	for (let i = 0; i <= originY; i += gridSize) {
		ctx.beginPath();
		ctx.moveTo(0, originY + i);
		ctx.lineTo(canvasWidth, originY + i);
		ctx.stroke();

		if (i > 0) {
			ctx.beginPath();
			ctx.moveTo(0, originY - i);
			ctx.lineTo(canvasWidth, originY - i);
			ctx.stroke();
		}
	}

	ctx.strokeStyle = 'black';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(0, originY); // X-axis
	ctx.lineTo(currentWidth, originY);
	ctx.moveTo(originX, 0); // Y-axis
	ctx.lineTo(originX, currentHeight);
	ctx.stroke();

	callerFunction();

  const gizmoCanvasX = currentWidth - 100; 
  const gizmoCanvasY = 100;
  drawGizmo(gizmoCanvasX, gizmoCanvasY); 

	requestAnimationFrame(renderCanvas);
}

let gridCheckInterval = setInterval(() => {
	gridSize = window.innerWidth / 20;
	currentWidth = window.innerWidth;
	currentHeight = window.innerHeight;
	currentOrigin = [currentWidth / 2, currentHeight / 2];
}, 100);


requestAnimationFrame(renderCanvas);
