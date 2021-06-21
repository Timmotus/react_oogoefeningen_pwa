import React, {Component } from "react";
import M from "materialize-css";
import * as materialize from "react-materialize";
import "./Exercise.css";
import * as faceTracking from "./../api/faceTracking";
import {get, set} from "idb-keyval";

export default class Exercise extends Component {  
    video = null;
    canvas = null;
    trackingInitPromise = null;
    calibrationOrExercise = "calibration";
    timer = null;

    constructor(props) {
        super(props);
        this.trackingInitPromise = faceTracking.initialize();
    }

    initializeTrackingVideo() {
        this.trackingInitPromise.then(() => {
            this.timer = setInterval(this.updateTrackingVideo, 50);
        });
    }

    async updateTrackingVideo() {
        let overlayImageGray = document.getElementById("calibrationFaceBorderGray");
        let overlayImageGreen = document.getElementById("calibrationFaceBorderGreen");
        let videoElem = document.getElementById("calibrationVideo");
        let canvasElem = document.getElementById("calibrationCanvas");
        let canvasContext = canvasElem.getContext("2d");

        const width = videoElem.parentElement.offsetWidth;
        const height = videoElem.parentElement.offsetHeight;
        const faceBorderWidth = width/3.5;
        const faceBorderHeight = height/2;

        canvasElem.width = width;
        canvasElem.height = height;

        canvasContext.drawImage(videoElem, 0, 0, width, height);
        let pixelDataBeforeOverlay = canvasContext.getImageData(0, 0, width, height);
        if (document.getElementById("step1")) {
            if (!document.getElementById("step1").hidden) {
                canvasContext.drawImage(faceTracking.isCentered() ? overlayImageGreen : overlayImageGray, (width/2) - (faceBorderWidth/2), (height/2) - (faceBorderHeight/2), faceBorderWidth, faceBorderHeight);
                console.log(faceTracking.isCentered());
            }
            else if (!faceTracking.isCentered()) canvasContext.drawImage(overlayImageGray, (width/2) - (faceBorderWidth/2), (height/2) - (faceBorderHeight/2), faceBorderWidth, faceBorderHeight);
        }
        faceTracking.update(pixelDataBeforeOverlay).then(matchedFace => {
            //canvasContext.putImageData(faceTracking.drawDebugImage(), 0, 0);
            if (!document.getElementById("step1")) {
                document.getElementById("headObscuredWarning").style.opacity = matchedFace ? "0.0" : "1.0";
                if (matchedFace) document.getElementById("headPositionWarning").style.opacity = faceTracking.isCentered() ? "0.0" : "1.0";
            }
        });
    }

    finishCalibration() {
        if (faceTracking.isCentered()) {
            if (faceTracking.calibrateDistance()) {
                window.location.reload();
            }
            else {
                M.toast({html: "Probeer in een goed belichte omgeving te zijn!"});
            }
        }
        else {
            M.toast({html: "Probeer in het midden van het plaatje te blijven!"});
        }
    }

    async addHistory (dist) {
        const history = await get('history');
        history.results.push(
            {
                date_time: new Date().toLocaleString(),
                data: dist
            }
        );
        await set("history", history);
    }

    finishExercise() {
        if (faceTracking.isCentered()/* && faceTracking.isLastUpdateSuccessful()*/) {
            // todo: check if the last result was valid
            console.log("Finished exercise!");
            const dist = faceTracking.getDistanceInCm();

            this.addHistory(dist);
            window.location.href = "/progress?data=" + dist;
        }
    }

    renderedOnce = false;

    render() {
        if (this.renderedOnce) {
            this.renderedOnce = true;
            return;
        }
        if (!faceTracking.isCalibrated()) {
            this.calibrationOrExercise = "calibration";
            return (
                <div className="exercise-container">
                    <h2>Calibratie Stap</h2>
                    <div id="faceTracking" style={{height: "30em"}}>
                        <img id="calibrationFaceBorderGray" src="/assets/face-border-gray.svg" hidden></img>
                        <img id="calibrationFaceBorderGreen" src="/assets/face-border-green.svg" hidden></img>
                        <video id="calibrationVideo" onCanPlay={() => this.initializeTrackingVideo()} hidden></video>
                        <canvas id="calibrationCanvas" style={{width: "100%"}}></canvas>
                    </div>
                    <div id="step1">
                        <h2>Probeer je gezicht binnen het frame te plaatsen. Wanneer het frame groen is, ga naar de volgende stap!</h2>
                        <materialize.Button onClick={() => {
                            document.getElementById("step1").hidden = true;
                            document.getElementById("step2").hidden = false;
                        }}>Volgende Stap</materialize.Button>
                    </div>
                    <div id="step2" hidden>
                        <h2>Probeer nu je gezicht op ongeveer 50cm afstand te plaatsen. Klik daarna op de Calibreer knop.</h2>
                        <h3>Gebruik (voor betere precisie) hiervoor een lange liniaal, meetlint of rolmaat.</h3>
                        <materialize.Button onClick={() => this.finishCalibration()}>Calibreer</materialize.Button>
                    </div>
                </div>
            );
        }
        else {
            this.calibrationOrExercise = "exercise";
            return (
                <div className="exercise-container">
                    <span>
                        <materialize.Button onClick={() => {faceTracking.recalibrate(); window.location.reload();}} style={{float: "right", fontSize: "0.6em"}}>{faceTracking.isCalibrated() ? "Hercalibreren" : "Calibreer Nu!"}</materialize.Button>
                    </span>
                    {/* Draw dot here instead of just rendering the camera! */}
                    <div id="faceTracking">
                        <img id="calibrationFaceBorderGray" src="/assets/face-border-gray.svg" hidden></img>
                        <img id="calibrationFaceBorderGreen" src="/assets/face-border-green.svg" hidden></img>
                        <video id="calibrationVideo" onCanPlay={() => this.initializeTrackingVideo()} hidden></video>
                        <canvas id="calibrationCanvas" style={{width: "100%"}}></canvas>
                    </div>
                    <div>
                        <h2>Houd de telefoon op een armslengte afstand recht voor je.</h2>
                        <h3 id="headPositionWarning" style={{color: "darkblue"}} style={{opacity: 0.0, transition: "opacity 0.5s", transitionDelay: "1s"}}>Zorg dat je jouw mobiel recht voor je gezicht houd!</h3>
                        <h3 id="headObscuredWarning" style={{color: "darkblue"}} style={{opacity: 0.0, transition: "opacity 0.5s", transitionDelay: "1s"}}>Zorg dat je geen bril op hebt of iets wat je gezicht verbergt!</h3>
                        <materialize.Button onClick={() => this.finishExercise()}>Ik kijk foutief</materialize.Button>
                    </div>
                </div>
            );
        }
    }

    componentDidMount() {
        this.video = document.getElementById("calibrationVideo");
        this.canvas = document.getElementById("calibrationCanvas");
        if (!navigator.mediaDevices) {
            alert("User didn't give access to the camera!");
        }
        navigator.mediaDevices.getUserMedia({ video: { height: this.video.parentElement.height, width: this.video.parentElement.width, facingMode: "user" } }).then(stream => {
            this.video.srcObject = stream;
            this.video.play();
        })
        .catch(err => {
            console.error("Error while loading the video stream:", err);
        });
    }

    componentWillUnmount() {
        clearTimeout(this.timer);
    }
}