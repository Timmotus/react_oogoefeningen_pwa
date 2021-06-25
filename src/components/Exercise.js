import React, { useEffect, useRef } from "react";
import M from "materialize-css";
import * as materialize from "react-materialize";
import "./Exercise.css";
import * as faceTracking from "./../api/faceTracking";
import {get, set} from "idb-keyval";
const dateFormat = require("dateformat");
import {REST_URL} from "../config";

const Exercise = () => {
    let chart = useRef();

    let trackingInitPromise = faceTracking.initialize();

    async function updateTrackingVideo() {
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
            // canvasContext.putImageData(faceTracking.drawDebugImage(), 0, 0);
            if (!document.getElementById("step1")) {
                document.getElementById("headObscuredWarning").style.opacity = matchedFace ? "0.0" : "1.0";
                if (matchedFace) document.getElementById("headPositionWarning").style.opacity = faceTracking.isCentered() ? "0.0" : "1.0";
            }

            if (matchedFace && document.getElementById("graph")) {
                let newData = faceTracking.getDeviationChartData();
                if (chart.current == null) return;
                if (!isFinite(newData[0]) || !isFinite(newData[1])) return;
                chart.current.data.datasets.forEach((dataset, index) => {
                    dataset.data.push(newData[index]);
                });
                console.log(faceTracking.getDeviationChartSize());
                chart.current.data.labels = Array.from(Array(chart.current.data.datasets[0].data.length).keys());
                chart.current.update();
            }
        });
    }

    function initializeTrackingVideo() {
        trackingInitPromise.then(() => {
            setInterval(updateTrackingVideo, 100);
        });
    }

    function finishCalibration() {
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

    async function addHistory (dist) {
        const history = await get('history');
        history.results.push(
            {
                date_time: new Date().toLocaleString(),
                data: dist
            }
        );
        await set("history", history);
    }

    function finishExercise() {
        // if (faceTracking.isCentered() && faceTracking.isLastUpdateSuccessful()) {
            console.log("Finished exercise!");
            const dist = 30;

            addHistory(dist).then(() => {
                get('connectId').then(value => {
                    if (value !== null && value !== "") {
                        let date = new Date();
                        let dateString = dateFormat(date, "dd-mm-yyyy HH:MM:ss");
                        fetch(`${REST_URL}/api/result`, {
                            method: 'POST',
                            body: JSON.stringify({exerciseId: value, date: dateString, cm: parseFloat(dist)}),
                            headers: {"Content-Type": "application/json"}
                        }).then(res => {
                            window.location.href = "/progress?data=" + dist;
                        });
                    }
                    else {
                        window.location.href = "/progress?data=" + dist;
                    }
                });
            }).finally(() => {
                
            });
        //}
    }

    useEffect(() => {
        let video = document.getElementById("calibrationVideo");
        //let canvas = document.getElementById("calibrationCanvas"); // UNUSED
        // video.play();
    
        if (!navigator.mediaDevices) {
            alert("User didn't give access to the camera!");
        }
        navigator.mediaDevices.getUserMedia({ video: { height: video.parentElement.height, width: video.parentElement.width, facingMode: "user" } }).then(stream => {
            video.srcObject = stream;
            video.play();
        })
        .catch(err => {
            console.error("Error while loading the video stream:", err);
        });
    });

    if (!faceTracking.isCalibrated()) {
        return (
            <div className="exercise-container">
                <h2>Calibratie Stap</h2>
                <div id="faceTracking" style={{height: "30em"}}>
                    <img id="calibrationFaceBorderGray" src="/assets/face-border-gray.svg" alt="border-gray" hidden></img>
                    <img id="calibrationFaceBorderGreen" src="/assets/face-border-green.svg" alt="border-green" hidden></img>
                    <video id="calibrationVideo" onCanPlay={() => initializeTrackingVideo()} hidden></video>
                    {/* <video controls loop id="calibrationVideo" onCanPlay={() => initializeTrackingVideo()} src="/scheel-kijk-video.mp4" hidden></video> */}
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
                    <materialize.Button onClick={() => finishCalibration()}>Calibreer</materialize.Button>
                    <h2>Probeer nu je gezicht op ongeveer 50cm afstand te plaatsen. Klik daarna op de Calibreer knop.</h2>
                    <h3>Gebruik (voor betere precisie) hiervoor een lange liniaal, meetlint of rolmaat.</h3>
                </div>
            </div>
        );
    }
    else {
        return (
            <div className="exercise-container">
                <span>
                    <materialize.Button onClick={() => {faceTracking.recalibrate(); window.location.reload();}} style={{float: "right", fontSize: "0.6em"}}>{faceTracking.isCalibrated() ? "Hercalibreren" : "Calibreer Nu!"}</materialize.Button>
                </span>
                <div id="faceTracking">
                    <img id="calibrationFaceBorderGray" src="/assets/face-border-gray.svg" alt="border-gray" hidden></img>
                    <img id="calibrationFaceBorderGreen" src="/assets/face-border-green.svg" alt="border-green" hidden></img>
                    <video id="calibrationVideo" onCanPlay={() => initializeTrackingVideo()} hidden></video>
                    {/* <video controls loop muted id="calibrationVideo" onCanPlay={() => initializeTrackingVideo()} src="/scheel-kijk.mp4" hidden></video> */}
                    <canvas id="calibrationCanvas" style={{width: "100%"}} hidden></canvas>
                    <div id="trainingCircle">Stip</div>
                </div>
                <div>
                    <h2>Houd de telefoon op een armslengte afstand recht voor je.</h2>
                    <h3 id="headPositionWarning" style={{color: "darkblue", opacity: 0.0, transition: "opacity 0.5s", transitionDelay: "1s"}}>Zorg dat je jouw mobiel recht voor je gezicht houd!</h3>
                    <h3 id="headObscuredWarning" style={{color: "darkblue", opacity: 0.0, transition: "opacity 0.5s", transitionDelay: "1s"}}>Zorg dat je geen bril op hebt of iets wat je gezicht verbergt!</h3>
                    <materialize.Button onClick={() => finishExercise()}>Ik kijk foutief</materialize.Button>
                </div>
                {/* <Line id="graph" ref={chart} data={{labels: [0], datasets:[
                    {label: "Left Eye", backgroundColor: "#ff0000"},
                    {label: "Right Eye", backgroundColor: "#0000ff"}
                ]}}></Line> */}
            </div>
        );
    }
}
export default Exercise;