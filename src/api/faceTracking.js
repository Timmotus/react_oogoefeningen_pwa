const CBuffer = require("CBuffer");
const faceapi = require("face-api.js");
const pico = require("picojs");
const vec2 = require("gl-vec2");

export let initialized = false;
export let calibrated = false;
let calibratedConversionRatio = null;

let eyeDeviations = new CBuffer(5000);
let previousResult = [0/*left eye*/, 0/*right eye*/, 0.0/*distance*/];

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
    calibrated = window.localStorage.getItem("calibrated-conversion-ratio") != null && !isNaN(parseFloat(window.localStorage.getItem("calibrated-conversion-ratio")));
    calibratedConversionRatio = window.localStorage.getItem("calibrated-conversion-ratio") == null ? 0 : parseFloat(window.localStorage.getItem("calibrated-conversion-ratio"));

    await faceapi.nets.ssdMobilenetv1.loadFromUri("/assets/weights");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/assets/weights");
    await faceapi.nets.tinyFaceDetector.loadFromUri("/assets/weights");
    
    await fetch("https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder").then(function(response) {
        response.arrayBuffer().then(buffer => picoHelper.facefinder_classify_region = pico.pico.unpack_cascade(new Int8Array(buffer)));
    });
    await fetch("https://drone.nenadmarkus.com/data/blog-stuff/puploc.bin").then(function(response) {
        response.arrayBuffer().then(buffer => picoHelper.do_puploc = pico.lploc.unpack_localizer(new Int8Array(buffer)));
    });
    console.info("faceTracking has been successfully initialized");
    initialized = true;
}

export const isInitialized = () => {
    return initialized;
}

// Method is asynchronous so that you can fetch the data using the getters later when the promise is fullfilled
export const update = async (imageData) => {
    lastImage.width = imageData.width;
    lastImage.height = imageData.height;
    lastImage.data = imageData;
    if (!initialized) {
        console.error("faceTracking has not been (fully) initialized yet, which you should do before trying to update the image!");
        lastImageTracking.successful = false;
        return false;
    }
    // For faceapi.js (facial feature tracking), the input needs to be passed as an tf.tensor3d
    let inputTensor = faceapi.tf.browser.fromPixels(imageData);

    let faceLandmarksResults = await faceapi.detectSingleFace(inputTensor, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
    inputTensor.dispose();
    if (!faceLandmarksResults) {
        console.debug("No face was detected by the faceapi.js library!");
        lastImageTracking.successful = false;
        return false;
    }

    let pupilTracking = true;
    let bestDet = null;
    if (pupilTracking) {
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
        bestDet = dets[0];
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
            lastImageTracking.successful = false;
            return false;
        }
        
        if (bestDet[3] <= 35.0) {
            console.debug("Couldn't detect reliable faces from lploc!");
            lastImageTracking.successful = false;
            return false;
        }

        // Left eye sides tracking

            lastImageTracking.leftEye.leftSide = vec2.fromValues(faceLandmarksResults.landmarks.getLeftEye()[0].x, faceLandmarksResults.landmarks.getLeftEye()[0].y);
            lastImageTracking.leftEye.rightSide = vec2.fromValues(faceLandmarksResults.landmarks.getLeftEye()[3].x, faceLandmarksResults.landmarks.getLeftEye()[3].y);


        // Right eye sides tracking

            lastImageTracking.rightEye.leftSide = vec2.fromValues(faceLandmarksResults.landmarks.getRightEye()[0].x, faceLandmarksResults.landmarks.getRightEye()[0].y);
            lastImageTracking.rightEye.rightSide = vec2.fromValues(faceLandmarksResults.landmarks.getRightEye()[3].x, faceLandmarksResults.landmarks.getRightEye()[3].y);


        // Left pupil tracking
        {
            let x = bestDet[0] - 0.075 * bestDet[2];
            let y = bestDet[1] - 0.175 * bestDet[2];
            let scale = 0.35 * bestDet[2];
            lastImageTracking.leftEye.pupil = vec2.fromValues(...picoHelper.do_puploc(x, y, scale, 63, picoImage));
            if (lastImageTracking.leftEye.pupil[0] < 0 || lastImageTracking.leftEye.pupil[1] < 0) {
                console.debug("Couldn't detect a (reliable) left pupil!");
                lastImageTracking.successful = false;
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
                lastImageTracking.successful = false;
                return false;
            }
        }

        if (calibrated) {
            let leftEyeSidesLength = vec2.dist(lastImageTracking.leftEye.leftSide, lastImageTracking.leftEye.rightSide);
            let leftEyePupilOffset = vec2.dist(lastImageTracking.leftEye.leftSide, lastImageTracking.leftEye.pupil);
            let leftEyePupilPercentage = leftEyeSidesLength / leftEyePupilOffset;

            let rightEyeSidesLength = vec2.dist(lastImageTracking.rightEye.leftSide, lastImageTracking.rightEye.rightSide);
            let rightEyePupilOffset = vec2.dist(lastImageTracking.rightEye.leftSide, lastImageTracking.rightEye.pupil);
            let rightEyePupilPercentage = rightEyeSidesLength / rightEyePupilOffset;

            let currResult = [leftEyePupilPercentage, rightEyePupilPercentage, getDistanceBetweenEyesInPixels()];

            if (previousResult[2] !== 0.0) {
                let eyeDeviation = [0, 0];
                let distanceDifferenceBetweenResults = currResult[2] - previousResult[2];
                for (let eye=0; eye<2; eye++) {
                    let pupilMovementBetweenResults = currResult[eye] - previousResult[eye];
                    eyeDeviation[eye] = pupilMovementBetweenResults / distanceDifferenceBetweenResults;
                }
                eyeDeviations.push(eyeDeviation);
            }
            previousResult = currResult;
        }
    }

    lastImageTracking.successful = true;
    if (pupilTracking) {
        lastImageTracking.boundingBox.lploc[0] = bestDet[1] - (bestDet[2] * 0.5);
        lastImageTracking.boundingBox.lploc[1] = bestDet[0] - (bestDet[2] * 0.5);
        lastImageTracking.boundingBox.lploc[2] = bestDet[2];
        lastImageTracking.boundingBox.lploc[3] = bestDet[2];
    }

    lastImageTracking.boundingBox.faceapi[0] = faceLandmarksResults.detection.box.x;
    lastImageTracking.boundingBox.faceapi[1] = faceLandmarksResults.detection.box.y;
    lastImageTracking.boundingBox.faceapi[2] = faceLandmarksResults.detection.box.width;
    lastImageTracking.boundingBox.faceapi[3] = faceLandmarksResults.detection.box.height;

    return true;
}

export const isCalibrated = () => {
    return calibrated;
}

export const isLastUpdateSuccessful = () => {
    return lastImageTracking.successful;
}

export const getDistanceInCm = () => {
    return (50.0/getDistanceBetweenEyesInPixels()) * calibratedConversionRatio;
}

export const isLookingCrossEyed = () => {
    if (eyeDeviations.size < 20) {
        return false;
    }

    return false;
}

function getDistanceBetweenEyesInPixels() {
    return vec2.dist(lastImageTracking.leftEye.leftSide, lastImageTracking.rightEye.rightSide);
}

// calibrates the distance
export const calibrateDistance = () => {
    if (!lastImageTracking.successful) {
        console.error("Can't calibrate when the image hasn't been updated or if the last update was unsuccessful during tracking!");
        return false;
    }

    if (!isCentered()) {
        console.error("Calibrating when the last image was not centered!");
    }

    calibratedConversionRatio = getDistanceBetweenEyesInPixels();
    window.localStorage.setItem("calibrated-conversion-ratio", calibratedConversionRatio.toString());
    return true;
}

export const recalibrate = () => {
    window.localStorage.removeItem("calibrated-conversion-ratio");
    calibrated = false;
}

export const isCentered = () => {
    if (!lastImageTracking.successful) {
        console.error("Requested whether the last frame was centered but it didn't track successfully");
        return false;
    }

    // Return if the right eye is left from the left eye (camera is likely upside down)
    if (lastImageTracking.leftEye.x >= lastImageTracking.rightEye.x) {
        console.error("Camera is likely upside down");
        return false;
    }

    let tolerancePercentageX = lastImage.width/6;
    let tolerancePercentageY = lastImage.height/6;

    let middlePointX = lastImageTracking.boundingBox.faceapi[0] + (lastImageTracking.boundingBox.faceapi[2]/2);
    let middlePointY = lastImageTracking.boundingBox.faceapi[1] + (lastImageTracking.boundingBox.faceapi[3]/2);

    if (!(((lastImage.width/2)-tolerancePercentageX) < middlePointX && ((lastImage.width/2)+tolerancePercentageX) > middlePointX)) {
        console.error("Head fell outside of center: X axis middle was "+((lastImage.width/2) - middlePointX).toString()+", but tolerence is " + tolerancePercentageX.toString());
        return false;
    }

    if (!(((lastImage.height/2)-tolerancePercentageY) < middlePointY && ((lastImage.height/2)+tolerancePercentageY) > middlePointY)) {
        console.error("Head fell outside of center: Y axis middle was "+Math.abs((lastImage.height/2) - middlePointY).toString()+", but tolerence is " + tolerancePercentageY.toString());
        return false;
    }

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

export const getDeviationChartData = () => {
    if (eyeDeviations.length === 0) return [0, 0];
    return eyeDeviations.last();
}

export const getDeviationChartSize = () => {
    return eyeDeviations.length;
}