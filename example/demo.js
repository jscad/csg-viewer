const makeCsgViewer = require('../src/index')
const {cube} = require('@jscad/scad-api').primitives3d
const {color} = require('@jscad/scad-api').color

const initializeData = function () {
  return cube({size: 100})
}
// dark bg : [0.211, 0.2, 0.207, 1]
// dark grid :  [1, 1, 1, 0.1],

const viewerOptions = {
  singleton: true, // ensures that no matter how many times you call the creator function, you still only get a single instance  
  background: [0.211, 0.2, 0.207, 1], // [1, 1, 1, 1],//54, 51, 53
  meshColor: [0.4, 0.6, 0.5, 1],
  grid: {
    color: [1, 1, 1, 0.1]
  },
  camera: {
    position: [450, 550, 700],
    target: [0, 0, 0],
    far: 18000
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
const csgViewer = makeCsgViewer(document.body, viewerOptions)
csgViewer(viewerOptions, {csg})

setTimeout(function (t) {
  csgViewer({controls: {zoomToFit: 'all'}})
}, 2000)
/*
setTimeout(function (t) {
  const csg = initializeData()
  csgViewer({controls: {zoomToFit: 'none'}, meshColor: [1, 0, 0, 1], background: [0.2, 1, 1, 1]}, {csg})
}, 4000) */
/* setInterval(function (t) {
  const csg = initializeData()
  // console.log('a new one')
  csgViewer(document.body, csg, viewerOptions)
}, 2000) */
