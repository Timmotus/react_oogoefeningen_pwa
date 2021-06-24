import React, {useEffect, useState} from "react";

import './Profile.css'
import NavBar from "./NavBar";
import {get, set} from "idb-keyval";
import jsQR from "jsqr";

const Profile = () => {

    const [connectId, setConnectId] = useState(null);
    const [history, setHistory] = useState(null);

    const getHistory = async () => {
        const history = await get('history');
        setHistory(history);
    }

    const getConnectId = async () => {
        const connectId = await get('connectId');
        setConnectId(connectId);
    }

    useEffect(() => {

        // States
        getHistory();
        getConnectId();

    }, []);

    const history_render = () => {
        if (history == null)
            return (
                <ul className="profile-history-list"><li>Geen Geschiedenis</li></ul>
            );
        else
            return (
                <ul className="profile-history-list">
                    {history.results.map(result => (
                        <li>{result.date_time}: {Math.round(result.data)}cm</li>
                    ))}
                </ul>
            );
    }

    const connect_render = () => {
        if (connectId == null || connectId === "")
            return (
                <div className="koppel-content">
                    <span className="koppel-code" id='koppel-code'>Geen koppel-code in gebruik.</span>
                    <button className="btn-koppel btn-1" id="koppel-btn" onClick={ () => {
                        document.querySelector('#koppel-div').hidden = false;
                        document.querySelector('#koppel-btn').hidden = true;
                        var video = document.createElement("video");
                            var canvasElement = document.getElementById("canvas");
                            var canvas = canvasElement.getContext("2d");
                            var loadingMessage = document.getElementById("loadingMessage");
                            var outputContainer = document.getElementById("output");
                            var outputMessage = document.getElementById("outputMessage");
                            var outputData = document.getElementById("outputData");
                            let continue_scan = true;

                            function drawLine(begin, end, color) {
                                canvas.beginPath();
                                canvas.moveTo(begin.x, begin.y);
                                canvas.lineTo(end.x, end.y);
                                canvas.lineWidth = 4;
                                canvas.strokeStyle = color;
                                canvas.stroke();
                            }

                            // Use facingMode: environment to attemt to get the front camera on phones
                            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
                                video.srcObject = stream;
                                video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
                                video.play();
                                requestAnimationFrame(tick);
                            });

                            function tick() {
                                loadingMessage.innerText = "⌛ Webcam aan het opstarten..."
                                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                                    loadingMessage.hidden = true;
                                    canvasElement.hidden = false;
                                    outputContainer.hidden = false;

                                    canvasElement.height = 300;// video.videoHeight;
                                    canvasElement.width = 300;// video.videoWidth;
                                    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                                    var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
                                    var code = jsQR(imageData.data, imageData.width, imageData.height, {
                                        inversionAttempts: "dontInvert",
                                    });
                                    if (code) {
                                        drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF3B58");
                                        drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF3B58");
                                        drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF3B58");
                                        drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF3B58");
                                        outputMessage.hidden = true;
                                        outputData.parentElement.hidden = false;
                                        outputData.innerText = code.data;
                                        setConnectId(code.data);
                                        set('connectId', code.data).finally(() => {
                                            continue_scan = false;
                                            window.location.reload();
                                        });
                                    } else {
                                        outputMessage.hidden = false;
                                        outputData.parentElement.hidden = true;
                                    }
                                }
                                if (continue_scan) requestAnimationFrame(tick);
                                else {

                                }
                            }
                    }}>Ontvang koppel-code</button>
                    <div id="koppel-div" hidden>
                        <div id="loadingMessage">🎥 Geen toegang tot de videostream (zorgt dat je de app toegang geeft tot je camera!)</div>
                        <canvas width="100" height="100" id="canvas" hidden></canvas>
                        <div id="output" hidden>
                            <div id="outputMessage">Geen QR code gedetecteerd.</div>
                            <div hidden><b>Data:</b><span id="outputData"></span></div>
                        </div>
                    </div>
                </div>
            );
        else
            return (
                <div className="koppel-content">
                    <span className="koppel-code" id='koppel-code'>Gekoppelde code: {connectId}</span>
                    <button className="btn-koppel btn-1" onClick={() => {
                        set('connectId', null).then();
                        setConnectId(null);
                    }}>Verwijder Koppeling</button>
                    {/* <button className="btn-koppel btn-2" id='koppel-share' onClick={() => {
                        history.results.forEach(result => {
                            fetch('https://oogzorg-backend.herokuapp.com/api/result', {
                                method: 'POST',
                                body: JSON.stringify({ exerciseId: connectId, date: result.date, cm: result.data })
                            }).then(res => console.log(res));
                        });
                    }}>Deel Resultaten</button> */}
                </div>
            );
    }

    return (
        <div className="profile-container">
            <h1>Profiel</h1>
            {connect_render()}
            <h1>Resultaten</h1>
            {history_render()}
            <NavBar/>
        </div>
    );
}

export default Profile;