import React, { useEffect, useRef } from "react";
import * as faceTracking from '../api/faceTracking';

const Camera = () => {
    const videoRef = useRef(null);
    const photoRef = useRef(null);
    const stripRef = useRef(null);
    
    let faceTrackingInitPromise = faceTracking.initialize();

    useEffect(() => {
        getVideo();
    }, [videoRef]);

    const getVideo = () => {
        navigator.mediaDevices
            .getUserMedia({ video: { width: 640 } })
            .then(stream => {
                let video = videoRef.current;
                video.srcObject = stream;
                video.play();
            })
            .catch(err => {
                console.error("error:", err);
            });
    };

    const paintToCanvas = () => {
        let video = videoRef.current;
        let photo = photoRef.current;
        let ctx = photo.getContext("2d");

        const width = 640;
        const height = 480;
        photo.width = width;
        photo.height = height;

        // Waits for the promise of the initialization, and then creates the interval
        faceTrackingInitPromise.then(() => setInterval(async () => {
            ctx.drawImage(video, 0, 0, width, height);

            await faceTracking.update(ctx.getImageData(0, 0, photo.width, photo.height));
            ctx.putImageData(faceTracking.drawDebugImage(), 0, 0); // Overlay the image that got rendered
        }, 50));
    };

    const takePhoto = () => {
        let photo = photoRef.current;
        let strip = stripRef.current;

        const data = photo.toDataURL("image/jpeg");

        const link = document.createElement("a");
        link.href = data;
        link.setAttribute("download", "myWebcam");
        link.innerHTML = `<img src='${data}' alt='thumbnail'/>`;
        strip.insertBefore(link, strip.firstChild);
    };

    return (
        <div id="camera-container">
            <button onClick={() => takePhoto()}>Take a photo!</button>
            <video ref={videoRef} onCanPlay={() => paintToCanvas()} />
            <canvas ref={photoRef} />
            <div>
                <div ref={stripRef}/>
            </div>
        </div>
    )
}

export default Camera;