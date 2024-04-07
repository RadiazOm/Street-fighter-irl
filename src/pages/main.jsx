import {useEffect, useRef, useState} from 'react'
import {PoseLandmarker,
    FilesetResolver,
    DrawingUtils} from "@mediapipe/tasks-vision"
import {Camera} from "@mediapipe/camera_utils";
import kNear from "../knear/Knear.js";
import '../App.css'
import Webcam from "react-webcam";
import * as ml5 from "ml5"



function Main() {
    let poseLandmarker;
    let runningMode = "VIDEO"
    let lastPrediction = ''
    let lest3predictions = [];
    let trainPoseCounter = 0
    let enablePredictions = false
    let trainCurrentPose = false
    let predictCurrentPose = false
    let sendinputs = true
    let lastVideoTime = -1
    const webcamRef = useRef(null);
    const canvasRef = useRef(null)
    const poseNameRef = useRef(null)
    const [currentMove, setCurrentMove] = useState('5')
    const k = 3
    let machine;
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
        loadModel()
        // getFromLocalStorage()
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
                width: 720,
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

    function loadModel() {
        machine = ml5.neuralNetwork({ task: 'classification', debug: true })
        const modelDetails = {
            model: './model/model.json',
            metadata: './model/model_meta.json',
            weights: './model/model.weights.bin'
        }
        machine.load(modelDetails, () => console.log("het model is geladen!"))
    }

    async function predictPose(landmarks) {
        predictCurrentPose = false
        let arrayLandmarks = []
        if (landmarks.length === 0) return
        for (const landmark of landmarks[0]) {
            arrayLandmarks.push(landmark.x, landmark.y)
        }
        let prediction = await machine.classify(arrayLandmarks)
        prediction = prediction[0].label.replace('|', '')


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

        setCurrentMove(prediction)
        console.log(prediction)
    }

    // function deleteMove() {
    //     if (!localStorage.getItem('poseData')) return
    //
    //     let poseData = JSON.parse(localStorage.getItem('poseData'))
    //
    //     for (const pose of poseData) {
    //         if (pose.label === poseNameRef.current.value) {
    //             console.log('yes')
    //             const key = poseData.indexOf(pose)
    //             delete poseData[key]
    //         }
    //     }
    //
    //     console.log(poseData)
    // }

    function togglePredictions() {
        enablePredictions = !enablePredictions
    }

    return (
        <div className="application" style={{overflow: "auto"}}>
            <div className="instruction">
                <p className="instruction">This is an application where you do street fighter moves irl and they will translate into the game, just start by punching!</p>
                <button onClick={togglePredictions}>Start!</button>
            </div>
            <div>
                <Webcam className="overlap" audio={false} ref={webcamRef} screenshotFormat="image/jpeg"/>
                <canvas className="overlap" ref={canvasRef}></canvas>
            </div>
            <img src={'./img/poses/' + currentMove + ".png"} className={"current-move"} alt=""/>
        </div>
    )
}

export default Main
