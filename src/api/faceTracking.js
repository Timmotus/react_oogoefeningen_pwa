const cyclist = require("cyclist");
const faceapi = require("face-api.js");
const pico = require("picojs");
const vec2 = require("gl-vec2");

let medianDifferentiating = new cyclist(2000);
let initialized = false;

let lastImage = {
    width: null,
    height: null,
    data: null,
};

let lastImageTracking = {
    successful: false,
    boundingBox: {
        faceapi: [0, 0, 0, 0],
        lploc: [0, 0, 0, 0]
    },
    leftEye: {
        pupil: null,
        leftSide: null,
        rightSide: null,
    },
    rightEye: {
        pupil: null,
        leftSide: null,
        rightSide: null,
    }
};

let picoHelper = {
    update_memory: pico.pico.instantiate_detection_memory(5), // make a buffer that holds the last 5 frames
    facefinder_classify_region: (r, c, s, pixels, ldim) => {return -1.0;},
    do_puploc: (r, c, s, nperturbs, pixels, nrows, ncols, ldim) => {return [-1.0, -1.0];},
    rgba_to_grayscale: (imageData) => {
        let grayImage = new Uint8Array(imageData.width * imageData.height);
        for (let y=0; y<imageData.height; y++) {
            for (let x=0; x<imageData.width; x++) {
                grayImage[y*imageData.width + x] = (2*imageData.data[y*4*imageData.width+4*x+0]+7 * imageData.data[y*4*imageData.width+4*x+1]+1 * imageData.data[y*4*imageData.width+4*x+2])/10;
            }
        }
        return grayImage;
    }
};

export const initialize = async () => {
    await faceapi.nets.ssdMobilenetv1.loadFromUri("/assets/weights");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/assets/weights");
    
    await fetch("https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder").then(function(response) {
        response.arrayBuffer().then(buffer => picoHelper.facefinder_classify_region = pico.pico.unpack_cascade(new Int8Array(buffer)));
    });
    await fetch("https://drone.nenadmarkus.com/data/blog-stuff/puploc.bin").then(function(response) {
        response.arrayBuffer().then(buffer => picoHelper.do_puploc = pico.lploc.unpack_localizer(new Int8Array(buffer)));
    });
    console.info("faceTracking has been successfully initialized");
    initialized = true;
}

// Method is asynchronous so that you can fetch the data using the getters later when the promise is fullfilled
export const update = async (imageData) => {
    lastImageTracking.successful = false;
    lastImage.width = imageData.width;
    lastImage.height = imageData.height;
    lastImage.data = imageData;
    if (!initialized) {
        console.error("faceTracking has not been (fully) initialized yet, which you should do before trying to update the image!");
        return false;
    }
    // For faceapi.js (facial feature tracking), the input needs to be passed as an tf.tensor3d
    let inputTensor = faceapi.tf.browser.fromPixels(imageData);

    let faceLandmarksResults = await faceapi.detectSingleFace(inputTensor).withFaceLandmarks();
    inputTensor.dispose();
    if (!faceLandmarksResults) {
        console.debug("No face was detected by the faceapi.js library!");
        return false;
    }

    // For lploc (pupil tracking), the input needs to be turned into a grayscale image
    let picoImage = {
        pixels: picoHelper.rgba_to_grayscale(imageData),
        nrows: imageData.height,
        ncols: imageData.width,
        ldim: imageData.width,
    };
    let params = {
        "shiftfactor": 0.1, // move the detection window by 10% of its size
        "minsize": 100,     // minimum size of a face
        "maxsize": 1000,    // maximum size of a face
        "scalefactor": 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
    }
    let dets = pico.pico.run_cascade(picoImage, picoHelper.facefinder_classify_region, params);
    dets = picoHelper.update_memory(dets);
    dets = pico.pico.cluster_detections(dets, 0.3);
    let bestDet = dets[0];
    if (dets.length > 1) {
        //console.debug("More then one face was detected, which might make it so that faceapi.js tracks a different face then lploc");
        for (let i=0; i<dets.length; i++) {
            if (bestDet[3] < dets[i][3]) {
                bestDet = dets[i];
            }
        }
    }
    else if (dets.length === 0) {
        console.debug("No face was detected by the lploc algorithm!");
        return false;
    }
    
    if (bestDet[3] <= 50.0) {
        console.debug("Couldn't detect reliable faces from lploc!");
        return false;
    }

    // Left pupil tracking
    {
        let x = bestDet[0] - 0.075 * bestDet[2];
        let y = bestDet[1] - 0.175 * bestDet[2];
        let scale = 0.35 * bestDet[2];
        lastImageTracking.leftEye.pupil = vec2.fromValues(...picoHelper.do_puploc(x, y, scale, 63, picoImage));
        if (lastImageTracking.leftEye.pupil[0] < 0 || lastImageTracking.leftEye.pupil[1] < 0) {
            console.debug("Couldn't detect a (reliable) left pupil!");
            return false;
        }
    }
    
    // Right pupil tracking
    {
        let x = bestDet[0] - 0.075 * bestDet[2];
        let y = bestDet[1] + 0.175 * bestDet[2];
        let scale = 0.35 * bestDet[2];
        lastImageTracking.rightEye.pupil = vec2.fromValues(...picoHelper.do_puploc(x, y, scale, 63, picoImage));
        if (lastImageTracking.rightEye.pupil[0] < 0 || lastImageTracking.rightEye.pupil[1] < 0) {
            console.debug("Couldn't detect a (reliable) right pupil!");
            return false;
        }
    }

    lastImageTracking.successful = true;
    lastImageTracking.boundingBox.lploc[0] = bestDet[1] - (bestDet[2] * 0.5);
    lastImageTracking.boundingBox.lploc[1] = bestDet[0] - (bestDet[2] * 0.5);
    lastImageTracking.boundingBox.lploc[2] = bestDet[2];
    lastImageTracking.boundingBox.lploc[3] = bestDet[2];

    lastImageTracking.boundingBox.faceapi[0] = faceLandmarksResults.detection.box.x;
    lastImageTracking.boundingBox.faceapi[1] = faceLandmarksResults.detection.box.y;
    lastImageTracking.boundingBox.faceapi[2] = faceLandmarksResults.detection.box.width;
    lastImageTracking.boundingBox.faceapi[3] = faceLandmarksResults.detection.box.height;

    return true;
}

// calibrates the distance
export const calibrateDistance = async () => {
    if (!lastImageTracking.successful) {
        console.error("Can't calibrate when the image hasn't been updated or if the last update was unsuccessful during tracking!");
        return false;
    }

    // use localstorage to restore previous calibrated data

    return true;
}

let debugCanvas = document.createElement("canvas");
let ctx = debugCanvas.getContext("2d");

export const drawDebugImage = () => {
    debugCanvas.width = lastImage.width;
    debugCanvas.height = lastImage.height;
    ctx.putImageData(lastImage.data, 0, 0);
    ctx.lineWidth = 4;
    if (lastImageTracking.successful) {
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.rect(lastImageTracking.boundingBox.faceapi[0], lastImageTracking.boundingBox.faceapi[1], lastImageTracking.boundingBox.faceapi[2], lastImageTracking.boundingBox.faceapi[3]);
        ctx.stroke();

        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.rect(lastImageTracking.boundingBox.lploc[0], lastImageTracking.boundingBox.lploc[1], lastImageTracking.boundingBox.lploc[2], lastImageTracking.boundingBox.lploc[3]);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(lastImageTracking.leftEye.pupil[1], lastImageTracking.leftEye.pupil[0], 1, 0, 2*Math.PI, false);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(lastImageTracking.rightEye.pupil[1], lastImageTracking.rightEye.pupil[0], 1, 0, 2*Math.PI, false);
        ctx.stroke();
    }
    return ctx.getImageData(0, 0, lastImage.width, lastImage.height);
}