import {useEffect, useState} from "react";
import * as ml5 from "ml5"
import '../App.css'


function Matrix() {
    let poses = ['5', '5lp', '5mp', '5hp', '5mk', '6', '236hp', '1']
    let [matrix, setMatrix] = useState(<></>);
    let [accuracy, setAccuracy] = useState(<h3>accuracy</h3>)
    let nn;

    useEffect(() => {
        loadModel()
    }, []);

    function getTestFromLocalStorage() {
        if (!localStorage.getItem('testData')) return

        return JSON.parse(localStorage.getItem('testData'))
    }

    function loadModel() {
        nn = ml5.neuralNetwork({ task: 'classification', debug: true })
        const modelDetails = {
            model: './model/model.json',
            metadata: './model/model_meta.json',
            weights: './model/model.weights.bin'
        }
        nn.load(modelDetails, () => console.log("het model is geladen!"))
    }

    async function testNNpose(pose)
    {
        let testData = getTestFromLocalStorage()

        let poses = []
        for (const poseObject of testData) {
            if (poseObject.label === pose) {
                poses.push(poseObject)
            }
        }


        let predictions = []
        for (const correctPose of poses) {
            let prediction = await nn.classify(correctPose.pose)
            prediction[0].label = prediction[0].label.replace('|', '')
            console.log('predicted: ' + correctPose.label + ' result: ' + prediction[0].label)
            predictions.push(prediction[0].label)
        }

        return predictions
    }

    async function createMatrix() {
        let rows = []
        let totalCorrectPoses = 0;
        let totalPoses = getTestFromLocalStorage().length
        for (const pose of poses) {
            const predictions = await testNNpose(pose)
            let td;
            td = poses.map((poseMap) => {
                let className = ''
                if (predictions.filter((element) => element === poseMap).length > 0) {
                    if (pose === poseMap) {
                        className = 'correct'
                        totalCorrectPoses += predictions.filter((element) => element === poseMap).length
                    } else {
                        className = 'wrong'
                    }

                }
                return <td className={className}>{predictions.filter((element) => element === poseMap).length}</td>
            })

            rows.push(<tr>
                <th>{pose}</th>
                {td}
                <td>total: {predictions.length}</td>
            </tr>)
        }
        setAccuracy(<h3>{totalCorrectPoses + " / " + totalPoses + " = " + totalCorrectPoses / totalPoses}</h3>)

        return (<table>
            <tbody>
            <tr>
                <th>Confusion matrix</th>
                <th>5</th>
                <th>5lp</th>
                <th>5mp</th>
                <th>5hp</th>
                <th>5mk</th>
                <th>6</th>
                <th>236hp</th>
                <th>1</th>
            </tr>
            {rows}
            </tbody>
        </table>)
    }

    async function buttonClick() {
        setMatrix(await createMatrix())
    }

    return (
        <>
            <div className="center">
                <button onClick={buttonClick}>Go!</button>
                <h1>Confusion matrix</h1>
                {accuracy}
                {matrix}
            </div>
        </>
    )
}

export default Matrix