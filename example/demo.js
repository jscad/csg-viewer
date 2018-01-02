const makeCsgViewer = require('../src/index')
const {cube} = require('@jscad/scad-api').primitives3d
const {color} = require('@jscad/scad-api').color

const initializeData = function () {
  return cube({size: 100 * Math.random()})
}
// dark bg : [0.211, 0.2, 0.207, 1]
// dark grid :  [1, 1, 1, 0.1],

const viewerOptions = {
  rendering: {
    background: [0.211, 0.2, 0.207, 1], // [1, 1, 1, 1],//54, 51, 53
    meshColor: [0.4, 0.6, 0.5, 1]
  },
  grid: {
    display: true,
    color: [1, 1, 1, 0.1]
  },
  camera: {
    position: [450, 550, 700]
  },
  controls: {
    zoomToFit: {
      targets: 'all'
    },
    limits: {
      maxDistance: 1600,
      minDistance: 0.01
    }
  }
}

const csg = initializeData()
const {csgViewer, viewerDefaults, viewerState$} = makeCsgViewer(document.body, viewerOptions)

// update / initialize the viewer with some data
csgViewer(viewerOptions, {solids: csg})

// you also have access to the defaults
console.log('viewerDefaults', viewerDefaults)

// you can subscribe to the state of the viewer to react to it if you want to,
// as the state is a most.js observable
viewerState$
  .throttle(5000)
  // .skipRepeats()
  .forEach(viewerState => console.log('viewerState', viewerState))

// you can change the state of the viewer at any time by just calling the viewer
// function again with different params
// NOTE: the params need to respect the SAME structure as the defaults
setTimeout(function (t) {
  csgViewer({camera: { position: [0, 100, 100] }})
}, 5000)

// or different params AND different data
setTimeout(function (t) {
  const csg = initializeData()
  csgViewer({overrideOriginalColors: true, rendering: {meshColor: [0.8, 0, 0, 1], background: [0.2, 1, 1, 1]}}, {solids: csg})
}, 10000)

// and again
setTimeout(function (t) {
  csgViewer({controls: {autoRotate: {enabled: true}}})
}, 15000)
