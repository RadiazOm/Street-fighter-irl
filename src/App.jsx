import {useEffect, useRef, useState} from 'react'
import {PoseLandmarker,
        FilesetResolver,
        DrawingUtils} from "@mediapipe/tasks-vision"
import {Camera} from "@mediapipe/camera_utils";
import kNear from "./knear/Knear.js";
import './App.css'
import Webcam from "react-webcam";
import * as kbm from "kbm-robot"


function App() {
    let poseLandmarker;
    let runningMode = "VIDEO"
    let lastPrediction = ''
    let trainPoseCounter = 0
    let enablePredictions = false
    let trainCurrentPose = false
    let predictCurrentPose = false
    let sendinputs = false
    let lastVideoTime = -1
    const webcamRef = useRef(null);
    const canvasRef = useRef(null)
    const poseNameRef = useRef(null)
    const currentMoveText = useRef(null)
    const k = 3
    const machine = new kNear(k)

    // machine.learn([6, 5, 5], 'dog')
    // machine.learn([4, 2, 6], 'dog')
    // machine.learn([3, 4, 4], 'dog')
    // machine.learn([4, 5, 5], 'dog')
    //
    // machine.learn([12, 20, 19], 'cat')
    // machine.learn([13, 17, 18], 'cat')
    // machine.learn([10, 15, 20], 'cat')
    // machine.learn([15, 21, 21], 'cat')
    //
    //
    // let prediction = machine.classify([12,18,17])
    // console.log(`I think this is a ${prediction}`)

    useEffect( () => {
        getFromLocalStorage()
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
                        if (trainCurrentPose) {
                            trainPose(result.landmarks, poseNameRef.current.value)
                        }
                        canvasCtx.save();
                        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        if (!result.landmarks) return
                        predictPose(result.landmarks)
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

    function getFromLocalStorage() {
        if (!localStorage.getItem('poseData')) return

        let poseData = JSON.parse(localStorage.getItem('poseData'))
        console.log(poseData)

        for (const pose of poseData) {
            machine.learn(pose.pose, pose.label)
        }
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


    function trainPose(landmarks, pose) {
        let arrayLandmarks = []
        for (const landmark of landmarks[0]) {
            arrayLandmarks.push(landmark.x, landmark.y)
        }
        machine.learn(arrayLandmarks, pose)
        addToLocalStorage(pose, arrayLandmarks)
        trainPoseCounter--
        if (trainPoseCounter < 0) {
            trainCurrentPose = false
        }
    }

    function predictPose(landmarks) {
        predictCurrentPose = false
        let arrayLandmarks = []
        if (landmarks.length === 0) return
        for (const landmark of landmarks[0]) {
            arrayLandmarks.push(landmark.x, landmark.y)
        }
        const prediction = machine.classify(arrayLandmarks)

        if (sendinputs) {
            if (prediction !== lastPrediction) {
                console.log('PUNCH!!!')
                // kbm.startJar()
                // kbm.press('h')
                //     .release('h')
                //     .go()
                //     .then(kbm.stopJar)
                console.log(prediction)
                fetch('http://localhost:8000', {
                    method: 'POST',
                    mode: 'cors',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        move: prediction
                    })
                })
            }
        }
        lastPrediction = prediction

        currentMoveText.current.innerHTML = prediction
        console.log(prediction)
    }

    function deletePoses() {
        localStorage.setItem('poseData', '')
    }

    function deleteMove() {
        if (!localStorage.getItem('poseData')) return

        let poseData = JSON.parse(localStorage.getItem('poseData'))

        for (const pose of poseData) {
            if (pose.label === poseNameRef.current.value) {
                console.log('yes')
                const key = poseData.indexOf(pose)
                delete poseData[key]
            }
        }

        console.log(poseData)
    }

    function sendInputs() {
        sendinputs = !sendinputs
    }

    function togglePredictions() {
        console.log('enabling tracking in 5 seconds')
        setTimeout(() => {
            enablePredictions = !enablePredictions
        }, 5000)
    }

    function toggleTrain() {
        console.log('training pose in 5 seconds')
        setTimeout(() => {
            trainCurrentPose = !trainCurrentPose
            trainPoseCounter = 20
            console.log('trained pose')
        }, 5000)
    }

    function togglePredictPose() {
        console.log('predicting pose in 5 seconds')
        setTimeout(() => {
            predictCurrentPose = !predictCurrentPose
        }, 5000)
    }

    function testInput() {
        setTimeout(() => {
            fetch('http://localhost:8000', {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    move: poseNameRef.current.value
                })
            })
        }, 5000)
    }

    return (
    <>
        <h1 className="current-move" ref={currentMoveText}>current move</h1>
        <div>
            <input type="text" placeholder="pose name" ref={poseNameRef}/>
            <button onClick={togglePredictions}>Toggle predictions</button>
            <button onClick={toggleTrain}>Train current pose</button>
            <button onClick={togglePredictPose}>Predict pose</button>
            <button onClick={deletePoses}>Delete model</button>
            <button onClick={deleteMove}>Delete move</button>
            <button onClick={sendInputs}>send inputs</button>
            <button onClick={testInput}>test input</button>
        </div>
        <div>
          <Webcam className="overlap" audio={false} ref={webcamRef} screenshotFormat="image/jpeg"/>
          <canvas className="overlap" ref={canvasRef}></canvas>
      </div>
    </>
    )
}

export default App
