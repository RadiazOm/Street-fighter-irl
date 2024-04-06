import {useEffect, useState} from "react";
import * as ml5 from "ml5"

function Matrix() {
    let poses = ['5', '5lp', '5mp', '5hp', '5mk', '6', '236hp', '1']
    let [matrix, setMatrix] = useState(<></>);
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
            const prediction = await nn.classify(correctPose.pose)
            console.log('predicted: ' + correctPose.label + ' result: ' + prediction[0].label)
            predictions.push(prediction[0].label)
        }

        return predictions
    }

    async function createMatrix() {
        let rows = []
        for (const pose of poses) {
            const predictions = await testNNpose(pose)

            rows.push(<tr>
                <th>{pose}</th>
                <td>{predictions.filter((element) => element === poses[0]).length}</td>
                <td>{predictions.filter((element) => element === poses[1]).length}</td>
                <td>{predictions.filter((element) => element === poses[2]).length}</td>
                <td>{predictions.filter((element) => element === poses[3]).length}</td>
                <td>{predictions.filter((element) => element === poses[4]).length}</td>
                <td>{predictions.filter((element) => element === poses[5]).length}</td>
                <td>{predictions.filter((element) => element === poses[6]).length}</td>
                <td>{predictions.filter((element) => element === poses[7]).length}</td>
            </tr>)
        }
        return (<table>
            <tbody>{rows}</tbody>
        </table>)
    }

    async function buttonClick() {
        setMatrix(await createMatrix())
    }

    return (
        <>
            <button onClick={buttonClick}>Go!</button>
            <h1>Confusion matix</h1>
            {matrix}
        </>
    )
}

export default Matrix