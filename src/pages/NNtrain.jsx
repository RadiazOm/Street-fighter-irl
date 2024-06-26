import * as ml5 from "ml5"
import {useEffect} from "react";


function NNtrain() {
    const nn = ml5.neuralNetwork({ task: 'classification', debug: true })

    useEffect(() => {
        // getFromLocalStorage()
    });

    // nn.addData([18,9.2,8.1,2], {label:"cat"})
    // nn.addData([20.1,17,15.5,5], {label:"dog"})
    // nn.addData([17,9.1,9,1.95], {label:"cat"})
    // nn.addData([23.5,20,20,6.2], {label:"dog"})
    // nn.addData([16,9.0,10,2.1], {label:"cat"})
    // nn.addData([21,16.7,16,3.3], {label:"dog"})
    //
    // nn.normalizeData()

    async function finishedTraining(){
        let testData = JSON.parse(localStorage.getItem('testData'))

        const results = await nn.classify(testData[27].pose)
        console.log(testData[27].label)
        console.log(results)
        const results1 = await nn.classify(testData[28].pose)
        console.log(testData[28].label)
        console.log(results1)
    }

    function train() {
        nn.normalizeData()
        nn.train({ epochs: 200 }, () => finishedTraining())
    }

    function getFromLocalStorage() {
        if (!localStorage.getItem('poseData')) return

        let poseData = JSON.parse(localStorage.getItem('poseData'))

        let debugpose = poseData.find((element) => element.label === '6')

        poseData = poseData.toSorted(() => (Math.random() - 0.5))
        // console.log(poseData)

        // console.log(poseData.find((element) => element.pose === debugpose.pose))

        for (const pose of poseData) {

            console.log(pose.label)
            console.log(poseData.find((element) => element.pose === pose.pose))
            nn.addData(pose.pose, {label: pose.label + "|"})
        }
        console.log('done loading')
    }

    function saveModel() {
        nn.save()
    }

    return (
        <>
            <div className="center">
                <button onClick={getFromLocalStorage}>Load data</button>
                <button onClick={train}>Train!</button>
                <button onClick={saveModel}>Save</button>
                <p>training :)</p>
            </div>
        </>
    )
}

export default NNtrain