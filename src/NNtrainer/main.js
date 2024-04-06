const nn = ml5.neuralNetwork({ task: 'classification', debug: true })

const data = [{colours: []}]

async function finishedTraining(){
    let testData = JSON.parse(localStorage.getItem('testData'))

    const results = await nn.classify(data[3].pose)
    console.log(data[3].label)
    console.log(results)
}

async function train() {
    nn.normalizeData()
    nn.train({ epochs: 100 }, () => finishedTraining())
}

async function getFromLocalStorage() {
    if (!localStorage.getItem('poseData')) return

    let poseData = JSON.parse(localStorage.getItem('poseData'))

    // let debugpose = poseData.find((element) => element.label === '6')

    // poseData = poseData.toSorted(() => (Math.random() - 0.5))
    // console.log(poseData)

    // console.log(poseData.find((element) => element.pose === debugpose.pose))

    for (let i = 0; i < data.length; i++) {
        console.log(data[i].label)
        nn.addData(data[i].pose, {label: data[i].label})
    }

    console.log('done loading')
}