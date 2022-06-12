class Vector {
    constructor(xFrom, yFrom, zFrom, xDelta, yDelta) {
        this.xFrom = xFrom;
        this.yFrom = yFrom;
        this.zFrom = zFrom;
        this.xDelta = xDelta;
        this.yDelta = yDelta;
    }
}

//p5.disableFriendlyErrors = true; // disables FES - might improve performance.

// FIXME - vector gradients instead?
// FIXME - mouse reporting only working in continuous drawing mode

let data;
let font;

let vectorData;
let helpData;

const DEFAULT_FRAMERATES = [10, 24, 30, 60];

const ASSET_TYPES = {
    data: "data",
    fonts: "fonts",
    images: "images",
    sounds: "sounds",
}
const getAssetPath = (type, asset) => `../../assets/${type}/${asset}`;

const AUDIO_SOURCES = {
    SOUND: "SOUND",
    MICROPHONE: "MICROPHONE",
    AUDIO_IN: "AUDIO_IN"
}

const config = {
    audioSource: "SOUND", // SOUND / MICROPHONE / AUDIOIN
    framerate: 10, // Default framerate to start with.
    defaultBackgroundColor: [180, 180, 180],
    defaultTextColor: 'darkslategray',//[100, 255, 255],
    centerRadius: 150,
    centerFill: [0, 0, 50],
    centerMaterialColor: [0, 0, 215],
    centerStroke: [50, 50, 50],
    centerStrokeWeight: 1,
    vectorStroke: [0, 255, 0],
    vectorStrokeWeight: 1,
    vectorScale: 12 // todo - make dynamic?
}

const colorScaling = {
    min: 0,
    max: 10
}

const colorScaleRGBValues = {
    min: [255, 255, 0],
    max: [0, 255, 255]
};

/**
 *
 * @param vector
 * @returns {number[]}
 */
const determineVectorColor = (vector) => {
    const RED = 0, GREEN = 1, BLUE = 2;
    let xDistance = Math.abs(vector.xFrom) + Math.abs(vector.xDelta);
    let yDistance = Math.abs(vector.yFrom) + Math.abs(vector.yDelta);
    let distance = Math.abs(xDistance) + Math.abs(yDistance);
    let rgb = [0, 0, 0];

    // I suck at math so pretty sure
    // this is the wrong way to calculate the from-blue-to-red scale + set the RGB.
    let deviation = colorScaling.max * ((100 / distance) / 10)

    rgb[GREEN] = 255 * deviation;
    rgb[RED] = 255 * (1 - deviation);
    rgb[BLUE] = 0;

    // Enable this instead for rainbow colors.
    // TODO - gradients? Color correction?
    // rgb[GREEN] = Math.floor(255 * Math.random());
    // rgb[RED] = Math.floor(255 * Math.random());
    // rgb[BLUE] = Math.floor(255 * Math.random());

    return rgb;
}

// Use FFT to detect kick and trigger inverse colors or something?
// FIXME - coordinates are made assuming a square shape instead of a circle, how to fix offset in corners?
// FIXME - some deltas are facing inwards towards the origin of the circle instead of outwards
const createFakeDataset = () => {
    let model = {
        vectors: [
                [
                    -62,
                    127,
                    3.7,
                    -2.2
                ]
            ],
        help: {
            "help - press key to:" : {
                "H":"Toggle this menu",
                "M":"Mute audio",
                "Q":"Toggle framerate",
                "G":"Toggle grid",
                "V":"Toggle vectors",
                "C":"Toggle center circle",
                "K":"Start/Stop drawing loop",
                // todo - add scrobbling controls and UI when playing from a sound file.
            }
        }
    }

    const amountOfVectors = 100; // Used to run at 1000, but was quite a performance hit.
    const radiusOffset = -config.centerRadius; // Origins for 3d objects start at center, instead of the edge.
    const diameter = config.centerRadius * 2;
    for (let i = 0; i < amountOfVectors; i++) {
        model.vectors.push(
            [
                // Math.random returns a number between 0 and 1,
                // so that can be used as a fraction of the center circle diameter.
                // The offset is needed because the origin starts at the center instead of the edge.
                radiusOffset + Math.floor(diameter * Math.random()),
                radiusOffset + Math.floor(diameter * Math.random()),
                -5 + Math.floor(10 * Math.random()),
                -5 + Math.floor(10 * Math.random())
            ]
        )
    }

    return model;
}


/**
 * Custom function that should be overridden to work with whatever raw dataset you want to map to another model.
 */
// FIXME - data modelling.

/**
 *
 * @param data
 * @returns {{vectors: *[]}}
 */
const interpretVectorData = (data) => {
    let vectorData = {
        vectors: []
    };
    vectorData.vectors = data.vectors.map(vector => {
        const mappedVector = new Vector(
            vector[0],
            vector[1],
            0, // Original data only lives on 2 planes.
            vector[0] + vector[2],
            vector[1] + vector[3]
        )
        mappedVector.color = determineVectorColor(mappedVector);
        return mappedVector;
    })
    //)
    return vectorData;
}

/**
 *
 * @param data
 * @returns {*}
 */
const interprethelp = (data) => data.help["help - press key to:"];

/**
 *
 */
const drawCenter = () => {
    stroke(...config.centerStroke);
    strokeWeight(config.centerStrokeWeight);
    noFill();
    circle(0, 0, config.centerRadius * 2); // Third param is diameter, not radius.
}

/**
 *
 * @param vectorData
 */
const drawVectors = (vectorData) => {
    strokeWeight(config.vectorStrokeWeight);
    vectorData.vectors.forEach(vector => {
        // 3d mode, harder on the performance, but cooler.

        let vectorHeight = Math.abs(vector.xDelta + vector.yDelta);

        push(); // to prevent translations from stacking.

        // normalMaterial for rainbow colors; useful for debugging, looks hella cool.
        // specularMaterial for colors that also get reflected by the light source; so with red light, no green gets reflected.
        // emissiveMaterial; Disregards light sources and does what it wants; always works, but you're missing the cool reflectiveness.

        //normalMaterial();//
        //specularMaterial(...vector.color);
        emissiveMaterial(...vector.color, 200); // FIXME - lighting; lack of green light makes all cylinders render in black/red.
        //fill(...vector.color);
        // translate(
        //     vector.xFrom,
        //     vector.yFrom,
        //     vector.zFrom + vectorHeight / 2, // Otherwise the cylinders pierce the center.
        // );

        rotateX(90); // Otherwise they're drawn vertically by default.

        // cylinder(1, vectorHeight);

        // stroke(...vector.color);
        // fill(...vector.color);
        // Disabling the rotations can help with debugging the length settings.
        // push();
        // todo - set new origin for rotation and offset/vectoring

        // translate(
        //   vectorHeight / 2,
        //   vectorHeight / 2,
        //   0
        // );

        // pop();
        // rotateX(90);
        // rotateX(vector.xDelta);
        //
        // rotateY(vector.yDelta);
        //
        pop();

        if (vector.xFrom > config.centerRadius && vector.yFrom > config.centerRadius) {
            console.warn(`Invalid: ${vector.xFrom}:${vector.yFrom}`);
            return;
        }

        // Line mode, easier on the graphics card and coordinate system, but also lame af.
        stroke(...vector.color);
        line(
            vector.xFrom,
            vector.yFrom,
            vector.zFrom,
            vector.xFrom + (vector.xDelta / config.vectorScale) ,
            vector.yFrom + (vector.yDelta / config.vectorScale),
            vectorHeight
        );
    });
}

// TODO - get the JSON layered by depth and padded by width.
let helpText;
const renderhelp = () => {
    helpText = JSON.stringify(helpData, null, 2);

    // todo - custom parsing to make this cooler

    textFont(font);
    textSize(12);
    textAlign(LEFT, CENTER);
    fill(...[config.defaultTextColor]);
    drawhelp(helpText);
};

const drawhelp = (help) => {
    let textRotationRange = [-45, -25]; // Or reversed for inverted controls.
    // let xAsPercentage = (windowWidth / mouseX);
    // let difference = Math.max(...textRotationRange) - Math.min(...textRotationRange);
    // let rotation = difference * xAsPercentage;
    // console.log(`rot: ${rotation}, diff: ${difference}, xAs%: ${xAsPercentage}, mouseX:${mouseX}`);
    drawingContext.shadowOffsetX = 5; // FIXME - why is drawing context not working?
    drawingContext.shadowOffsetY = -5;
    drawingContext.shadowBlur = 500;
    drawingContext.shadowColor = [255, 255, 0];

    push();
    translate(windowWidth / 12, 0);
    let offset = textWidth(help) / 2;
    //console.log(`offset: ${offset}`);
    translate(50, 0);
    rotateY(mapScale(mouseX, [0, windowWidth], textRotationRange));
    text(help, 0, 0);
    pop();
};

/**
 * Not ridiculously hard to do by hand,
 * but doing this over and over again is getting annoying.
 * @param input whatever number you want to place on scale B, coming from scale A.
 * @param scaleA an array of a min/max pair for scale A.
 * @param scaleB an array of a min/max pair for scale B.
 */
const mapScale = (input, scaleA, scaleB) => {
    const MIN = 0, MAX = 1
    let differenceA = scaleA[MAX] - scaleA[MIN];
    let differenceB = scaleB[MAX] - scaleB[MIN];
    let factor = input / scaleA[MAX];
    let result = scaleB[MIN] + differenceB * factor;
    // console.log(`
    //     input: ${input}
    //     differenceA: ${differenceA}
    //     differenceB: ${differenceB}
    //     factor: ${factor}
    //     result: ${result}
    // `)
    return result;
};


function preload() {
    data = createFakeDataset();

    // https://fonts.google.com/specimen/JetBrains+Mono?query=jetbrains+mono
    font = loadFont(getAssetPath(ASSET_TYPES.fonts,"JetBrainsMono-Light.ttf"));
    if (config.audioSource === AUDIO_SOURCES.SOUND)
        soundFile = loadSound(getAssetPath(ASSET_TYPES.sounds, "YOUR_SOUND_FILE_HERE.mp3"));
}

let audioIn;
let fft;

// Raw input volume detected by the microphone.
let microphoneVolume;

// Minimal amount of volume input for the microphone, 0 - 100%.
let volumeThreshold = 0; // FIXME - use exponantial bezier curve to prevent jittery look?
// FIXME - don't make center expand too much past field of view
// Volume after corrections, usable for triggering visualizations.
let actionableVolume;

let grid = [];
let gridLines = [];

const generateGridlines = () => {

    widthDivisions = windowWidth / 5;
    heightDivisions = windowHeight / 5;
    depthDivisions = height; // lesser of the two. Depth is only conceptual, so no calculation needed here.

    let startingPositionX = 0 - windowWidth / 2;
    let startingPositionY = 0 - windowHeight / 2;
    let startingPositionZ = 0 - windowWidth / 2;

    const fromTopLeft = (coordinate, windowAxis) => coordinate - windowAxis / 2;

    for (let x = startingPositionX; x < windowWidth; x+= widthDivisions) {
        for (let y = startingPositionY; y < windowHeight; y+= heightDivisions) {
            for (let z = startingPositionZ; z < windowWidth; z += widthDivisions) {

                // Horizontals
                gridLines.push({
                    x1: fromTopLeft(0, windowWidth),
                    y1: fromTopLeft(y, windowHeight),
                    z0: z,
                    x2: windowWidth,
                    y2: fromTopLeft(y, windowHeight),
                    z2: z
                });

                // Verticals
                gridLines.push({
                    x1: x,
                    y1: y,
                    z0: z,
                    x2: x,
                    y2: windowHeight,
                    z2: z
                });

                // Z-lines
                gridLines.push({
                    x1: x,
                    y1: fromTopLeft(y, windowHeight),
                    z0: z,
                    x2: x,
                    y2: fromTopLeft(y, windowHeight),
                    z2: windowWidth
                });

                grid.push({x: fromTopLeft(x, windowWidth), y: fromTopLeft(y, windowHeight), z: z});
            }
        }
    }
}

/**
 * When the main audio source is set to listening to microphone input, this will configure the audio.
 */
const configureMicrophoneInput = () => {
    audioIn = new p5.AudioIn(); // Examples use a different line of code; you need this one: https://p5js.org/reference/#/p5.AudioIn/getSources
    audioIn.start();
    audioIn.getSources(
        sources => {
            console.warn('Detected audio sources:');
            console.log(sources)
        },
        error => {
            console.error(`Error while fetching audio sources:`);
            console.error(error);
        }
    );
}

let soundFile;
let soundVolume;
let amplitude;

/**
 * When the main audio input source is set to loading a sound file from assets/sounds, this will configure the audio.
 */
const configureSoundAssetInput = () => {
    fft = new p5.FFT();
    amplitude = new p5.Amplitude();
    soundFile.loop();
}

/**
 * Configures the audio based on the config.audioSource setting.
 */
const configureAudio = () => {
    switch (config.audioSource) {
        case AUDIO_SOURCES.MICROPHONE:
            configureMicrophoneInput();
            break;
        case AUDIO_SOURCES.SOUND:
            configureSoundAssetInput();
            break;
        default:
            console.error(`Unable to set sound input - Does config.audioSource have a valid value?`);
    }
}

function setup() {
    vectorData = interpretVectorData(data);
    helpData = interprethelp(data);
    createCanvas(1080, 720, WEBGL); // When changing, keep in mind performance overhead and aspect ratio.
    normalMaterial();

    // Only works on Windows, if "Stereo Mix" device is enabled and available under "playback devices".
    // audioIn.setSource(3);

    configureAudio();

    frameRate(config.framerate);
    angleMode(DEGREES); // FIXME - can't move to config?
    // todo - replace orbitControl;
    //  scroll to zoom,
    //  tracking for rotating the text (scaled),
    //  dragging for center orientation.
    // todo - looping toggle through keyboard tracking?

    generateGridlines();

    // Enabling continuous loop might cause performance issues.
    //noLoop(); // VERIFY - Stops the drawing loop, preventing the memory leak?
}

// TODO/FIXME - make an interface for this so I don't have to write all these checks.
const getAudioLevel = () => {
    if (config.audioSource === AUDIO_SOURCES.MICROPHONE)
        return audioIn.getLevel() * 1000;
    if (config.audioSource === AUDIO_SOURCES.SOUND)
        return amplitude.getLevel() * 1000;
}

const getActionableVolume = () => {
    if (config.audioSource === AUDIO_SOURCES.MICROPHONE)
        return microphoneVolume > volumeThreshold ? microphoneVolume : 0;
    if (config.audioSource === AUDIO_SOURCES.SOUND)
        return soundVolume > volumeThreshold ? soundVolume : 0;
}
const drawCircle = () => {
        microphoneVolume = getAudioLevel();
        soundVolume = getAudioLevel();
        actionableVolume = getActionableVolume();
        //console.log(`audioIn level: ${microphoneVolume / 1000} / microphoneVolume: ${microphoneVolume}`);
        push();
        let color = [175, 175, 175, 100];
        stroke(125, 125, 125);
        strokeWeight(3);
        noFill();
        circle(0, 0, actionableVolume * 40);
        stroke(150, 150, 150);
        strokeWeight(2);
        noFill();
        circle(0, 0, actionableVolume * 30);
        stroke(175, 175, 175);
        strokeWeight(1);
        noFill();
        circle(0, 0, actionableVolume * 20);
        config.vectorScale = mapScale(actionableVolume, [0, 100], [5, -3]);
        pop();
        // rotateX(rotation);
        // rotateY(rotation);
        // rotateZ(rotation);
}

const drawGrid = () => {
    push();
    stroke(125, 125, 125);
    strokeWeight(1);
    gridLines.forEach((p, index) => {
        if (index < gridLines.length - 1) {
            let next = gridLines[index + 1];
            // point(p.x, p.y, p.z);
            line(p.x1, p.y1, p.z0, p.x2, p.y2, p.z2);
        }
    });
    pop();
}

let skipFramesBeforeLogging = config.framerate;
let currentlySkippedFrames = 0;

let showCenter = true;
let showVectors = true;
let showhelp = true;
let showGrid = true;

// TODO - hookup audio input to center radius?
// TODO - fix cylinder rendering using coordinates with atan as rotation: let a = atan2(mouseY - height / 2, mouseX - width / 2);
function draw() {
    background(...config.defaultBackgroundColor);
    ambientLight(0, 0, 100);
    let dirX = (mouseX / width - 0.5) * 2;
    let dirY = (mouseY / height - 0.5) * 2;
    directionalLight(125, 0, 125, -dirX, -dirY, -1);

    if (showGrid) {
        drawGrid();
    }
    // Just to demonstrate - 3D shapes are drawn with the center as origin, not from their edge!
    // box();
    // rotateX(90);
    // cylinder(2, 100);

    //let amplitude = new p5.Amplitude();
    if (!muted) {
        drawCircle();
    }
    if (showCenter){
        drawCenter();
    }
    if (showVectors){
        drawVectors(vectorData); // FIXME - order was only changed to accommodate translation stack
    }
    if (showhelp){
        renderhelp();
    }

    orbitControl(1, 1);
    // console.log(`frame: ${currentlySkippedFrames}`);
    // if (currentlySkippedFrames === 0) {
    //     console.warn(`looping: ${toggleLoop}`);
    // }
    // currentlySkippedFrames++;
    // if (currentlySkippedFrames >= config.framerate)
    //     currentlySkippedFrames = 0;
}

// VERIFY - Killing the loop seems to be an effective way of killing the memory leak so far.
// using touchStarted/touchEnded ensures the rendering will still take place when moving the camera,
// while outside of active dragging it doesn't keep re-drawing unnecessarily.
// function touchStarted(event) {
//     if (!isLooping())
//         loop();
// }
//
// function touchEnded(event) {
//     if (isLooping())
//         noLoop();
// }

function mouseWheel(event) {

}

const generateCoordinatesInsideCircle = () => {
  let radius = r * Math.sqrt(Math.floor(Math.random() * 100));
  // todo
};

let toggleLoop = true;
function toggleRedrawLoop() {
    toggleLoop = !toggleLoop;
    if (toggleLoop)
        loop();
    else
        noLoop();

    console.warn(`Looping ${toggleLoop? 'enabled':'disabled'}.`);
}

let framerateIndex = 0;
function changeFrameRate() {
    framerateIndex++;
    if (framerateIndex === DEFAULT_FRAMERATES.length)
        framerateIndex = 0;
    let newFrameRate = DEFAULT_FRAMERATES[framerateIndex];
    frameRate(newFrameRate);
    console.warn(`Framerate set to ${newFrameRate}`);
}

// FIXME - fix drawing and rendering when unmuting.
let muted = false;
function muteMicrophone() {
    if (muted){
        muted = false;
        audioIn.start();
        console.warn('Started listening for audio input.');
    }
    else {
        muted = true;
        audioIn.stop();
        console.warn('Stopped listening for audio input.');
    }
}

const playPauseMusic = () => {
    if (soundFile.isPlaying())
        soundFile.pause();
    else
        soundFile.loop();
}

// todo - add something for resetting the position
const KEYCODE_C = 67;
const KEYCODE_G = 71;
const KEYCODE_H = 72;
const KEYCODE_K = 75;
const KEYCODE_M = 77;
const KEYCODE_P = 80;
const KEYCODE_Q = 81;
const KEYCODE_V = 86;
function keyPressed() {
    console.log(`Detected keycode: ${keyCode}`); // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
    switch (keyCode) {
        case KEYCODE_K:
            toggleRedrawLoop();
            break;
        case KEYCODE_Q:
            changeFrameRate();
            break;
        case KEYCODE_M:
            if (config.audioSource === AUDIO_SOURCES.MICROPHONE)
                muteMicrophone();
            else if (config.audioSource === AUDIO_SOURCES.SOUND)
                playPauseMusic();
            break;
        case KEYCODE_C:
            showCenter = !showCenter;
            break;
        case KEYCODE_V:
            showVectors = !showVectors;
            break;
        case KEYCODE_H:
            showhelp = !showhelp;
            break;
        case KEYCODE_G:
            showGrid = !showGrid;
            break;
    }
}

function touchStarted() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}