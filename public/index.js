const create360Viewer = require('../');
const getMaxTextureSize = require('./getMaxTextureSize');
const dragDrop = require('drag-drop');

const dropRegion = document.querySelector('#drop-region');

// Get a canvas of some sort, e.g. fullscreen or embedded in a site
const canvas = createCanvas({
    canvas: document.querySelector('#canvas'),
    // without this, the canvas defaults to full-screen
    //viewport: [ 20, 20, 500, 256 ]
});

// Get the max image size possible
const imageUrl = getImageURL();

// whether to always rotate the view

var image1 = new Image()
var image2 = new Image()

// upload the first image here
startRecursion("img_4.png", null)

function startRecursion(img, prevviewer, theta, phi) {
    if (prevviewer != null) {
        prevviewer.stop()
    }

    const image = new Image();
    image.src = img;
    image.onload = () => {
        // Setup the 360 viewer
        const viewer = create360Viewer({
            image: image,
            canvas: canvas
        });
        viewer.controls.phi = phi ? phi : 1.25
        viewer.controls.theta = theta ? theta : 0

        setupDragDrop(canvas, viewer);

        // Start canvas render loop
        viewer.start();

        viewer.on('tick', (dt) => {

            if (viewer.controls.theta >= 0.8) {
                viewer.stop()
                if (image2.src !== "") {
                    startSecondRecursion(image2.src, viewer, viewer.controls.theta, viewer.controls.phi)
                } else {
                    startSecondRecursion("img_3.png", viewer, viewer.controls.theta, viewer.controls.phi)
                }
            }
        });
    }
}

function startSecondRecursion(img, prevviewer, theta, phi) {
    if (prevviewer != null) {
        prevviewer.stop()
    }

    const image = new Image();
    image.src = img;
    image.onload = () => {


        // Setup the 360 viewer
        const viewer = create360Viewer({
            image: image,
            canvas: canvas
        });
        viewer.controls.phi = phi ? phi : 0
        viewer.controls.theta = theta ? theta : 0
        setupDragDrop(canvas, viewer);

        // Start canvas render loop
        viewer.start();


        viewer.on('tick', (dt) => {
            if (viewer.controls.theta <= -2.4 || viewer.controls.theta <= -0.08) {
                viewer.stop()

                if (image1.src !== "") {
                    startRecursion(image1.src, viewer, viewer.controls.theta, viewer.controls.phi)
                } else {
                    startRecursion("img_4.png", viewer, viewer.controls.theta, viewer.controls.phi)
                }
            }
        });
    }
}

// Utility to create a device pixel scaled canvas
function createCanvas(opt = {}) {
    // default to full screen (no width/height specified)
    const viewport = opt.viewport || [0, 0];

    const canvas = opt.canvas || document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = `${viewport[0]}px`;
    canvas.style.left = `${viewport[1]}px`;

    // Resize the canvas with the proper device pixel ratio
    const resizeCanvas = () => {
        // default to fullscreen if viewport width/height is unspecified
        const width = typeof viewport[2] === 'number' ? viewport[2] : window.innerWidth;
        const height = typeof viewport[3] === 'number' ? viewport[3] : window.innerHeight;
        const dpr = window.devicePixelRatio;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    };

    // Ensure the grab cursor appears even when the mouse is outside the window
    const setupGrabCursor = () => {
        canvas.addEventListener('mousedown', () => {
            document.documentElement.classList.remove('grabbing');
            document.documentElement.classList.add('grabbing');
        });
        window.addEventListener('mouseup', () => {
            document.documentElement.classList.remove('grabbing');
        });
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    setupGrabCursor();
    return canvas;
}

function getImageURL() {
    // Choose a large texture size based on our GPU
    const maxTextureSize = getMaxTextureSize();
    let imageUrl = 'pano_2048.jpg';
    if (maxTextureSize >= 7000) imageUrl = 'pano_7000.jpg';
    else if (maxTextureSize >= 4096) imageUrl = 'pano_4096.jpg';
    return imageUrl;
}


function setupDragDrop(canvas, viewer) {
    dragDrop(canvas, {
        onDragEnter: () => {
            dropRegion.style.display = '';
        },
        onDragLeave: () => {
            dropRegion.style.display = 'none';
        },
        onDrop: (files) => {
            var img = new Image();
            img.onload = () => {
                viewer.texture(img);
            };
            img.onerror = () => {
                alert('Could not load image!');
            };
            img.crossOrigin = 'Anonymous';
            img.src = URL.createObjectURL(files[0]);

            if (image1.src === "") {

                image1.src = img.src


            } else if (image2.src === "") {

                image2.src = img.src

            }
        }
    });
}