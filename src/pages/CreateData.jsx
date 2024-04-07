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

    function getTestFromLocalStorage(label) {
        if (!localStorage.getItem('testData')) return 0

        const data = JSON.parse(localStorage.getItem('testData'))
        let occurances = 0

        for (const item of data) {
            if (item.label === label) {
                occurances++
            }
        }

        return occurances
    }

    function getFromLocalStorage(label) {
        if (!localStorage.getItem('poseData')) return

        const data = JSON.parse(localStorage.getItem('poseData'))
        let occurances = 0

        for (const item of data) {
            if (item.label === label) {
                occurances++
            }
        }

        return occurances    }

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
            <div className="center">
                <div>
                    <h2>train dataset:</h2>
                    <p>5: {getFromLocalStorage('5')}</p>
                    <p>5lp: {getFromLocalStorage('5lp')}</p>
                    <p>5mp: {getFromLocalStorage('5mp')}</p>
                    <p>5hp: {getFromLocalStorage('5hp')}</p>
                    <p>5mk: {getFromLocalStorage('5mk')}</p>
                    <p>6: {getFromLocalStorage('6')}</p>
                    <p>236hp: {getFromLocalStorage('236hp')}</p>
                    <p>1: {getFromLocalStorage('1')}</p>
                    <h2>test dataset:</h2>
                    <p>5: {getTestFromLocalStorage('5')}</p>
                    <p>5lp: {getTestFromLocalStorage('5lp')}</p>
                    <p>5mp: {getTestFromLocalStorage('5mp')}</p>
                    <p>5hp: {getTestFromLocalStorage('5hp')}</p>
                    <p>5mk: {getTestFromLocalStorage('5mk')}</p>
                    <p>6: {getTestFromLocalStorage('6')}</p>
                    <p>236hp: {getTestFromLocalStorage('236hp')}</p>
                    <p>1: {getTestFromLocalStorage('1')}</p>
                </div>
                <div>
                    <input type="text" placeholder="pose name" ref={poseNameRef}/>
                    <button onClick={removeDataset}>Reset dataset</button>
                    <button onClick={togglePredictions}>Toggle predictions</button>
                    <button onClick={toggleTrain}>Train current pose</button>
                    <button onClick={toggleTestTrain}>Train current test pose</button>
                </div>
                <div>
                    <Webcam className="overlap" style={{top: "30em"}} audio={false} ref={webcamRef} screenshotFormat="image/jpeg"/>
                    <canvas className="overlap" style={{top: "30em"}} ref={canvasRef}></canvas>
                </div>
            </div>
        </>
    )
}

export default CreateData