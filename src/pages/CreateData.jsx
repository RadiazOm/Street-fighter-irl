import Webcam from "react-webcam";
import {useEffect, useRef} from "react";
import {DrawingUtils, FilesetResolver, PoseLandmarker} from "@mediapipe/tasks-vision";
import {Camera} from "@mediapipe/camera_utils";
import kNear from "../knear/Knear.js";

function CreateData() {

    let poseLandmarker;
    let runningMode = "VIDEO"
    let enablePredictions = false
    let trainCurrentPose = false
    let trainTestPose = false
    let lastVideoTime = -1
    const webcamRef = useRef(null);
    const canvasRef = useRef(null)
    const poseNameRef = useRef(null)
    const k = 3
    const machine = new kNear(k)

    useEffect( () => {
        getPoseLandmarker()
            .then(predictLandmarks)
    }, [])

    function predictLandmarks() {
        if (
            typeof webcamRef.current !== "undefined" &&
            webcamRef.current !== null
        ) {
            if (!webcamRef.current?.video) return
            const canvasCtx = canvasRef.current.getContext('2d')
            const drawingUtils = new DrawingUtils(canvasCtx)
            const camera = new Camera(webcamRef.current.video, {
                onFrame: async () => {
                    if (!webcamRef.current?.video || !enablePredictions) return
                    let startTimeMs = performance.now()
                    if (lastVideoTime === webcamRef.current.video.currentTime) return
                    lastVideoTime = webcamRef.current.video.currentTime
                    poseLandmarker.detectForVideo(webcamRef.current.video, startTimeMs, (result) => {
                        if (trainCurrentPose || trainTestPose) {
                            trainPose(result.landmarks, poseNameRef.current.value)
                        }
                        canvasCtx.save();
                        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        if (!result.landmarks) return
                        for (const landmark of result.landmarks) {
                            drawingUtils.drawLandmarks(landmark, { radius : 3
                            })
                            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
                        }
                        canvasCtx.restore();
                    })
                },
                width: 640,
                height: 480,
            });
            camera.start();
        }
    }

    async function getPoseLandmarker() {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                delegate: "GPU"
            },
            runningMode: runningMode,
            numPoses: 1
        });
    }

    function addToLocalStorage(pose, landmarks) {
        let poseData = []
        if (localStorage.getItem('poseData')) {
            poseData = JSON.parse(localStorage.getItem('poseData'))
        }
        const newPose = {
            pose: landmarks,
            label: pose
        }
        poseData.push(newPose)
        localStorage.setItem('poseData', JSON.stringify(poseData))
    }

    function addToTestLocalStorage(pose, landmarks) {
        let poseData = []
        if (localStorage.getItem('testData')) {
            poseData = JSON.parse(localStorage.getItem('testData'))
        }
        const newPose = {
            pose: landmarks,
            label: pose
        }
        poseData.push(newPose)
        localStorage.setItem('testData', JSON.stringify(poseData))
    }

    function trainPose(landmarks, pose) {
        let arrayLandmarks = []
        for (const landmark of landmarks[0]) {
            arrayLandmarks.push(landmark.x, landmark.y)
        }
        console.log(trainTestPose)
        if (trainTestPose) {
            addToTestLocalStorage(pose, arrayLandmarks)
        } else {
            addToLocalStorage(pose, arrayLandmarks)
        }
        trainCurrentPose = false
        trainTestPose = false
    }

    function togglePredictions() {
        console.log('enabling tracking in 5 seconds')
        setTimeout(() => {
            enablePredictions = !enablePredictions
        }, 5000)
    }

    function toggleTestTrain() {
        console.log('training pose in 5 seconds')
        setTimeout(() => {
            trainTestPose = !trainTestPose
            console.log('trained pose')
        }, 1)
    }

    function toggleTrain() {
        console.log('training pose in 5 seconds')
        setTimeout(() => {
            trainCurrentPose = !trainCurrentPose
            console.log('trained pose')
        }, 5000)
    }

    function removeDataset() {
        localStorage.setItem('poseData', '')
    }

    return (
        <>
            <div>
                <input type="text" placeholder="pose name" ref={poseNameRef}/>
                <button onClick={removeDataset}>Reset dataset</button>
                <button onClick={togglePredictions}>Toggle predictions</button>
                <button onClick={toggleTrain}>Train current pose</button>
                <button onClick={toggleTestTrain}>Train current test pose</button>
            </div>
            <div>
                <Webcam className="overlap" audio={false} ref={webcamRef} screenshotFormat="image/jpeg"/>
                <canvas className="overlap" ref={canvasRef}></canvas>
            </div>
        </>
    )
}

export default CreateData