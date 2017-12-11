const makeCsgViewer = require('../src/index')
const {cube} = require('@jscad/scad-api').primitives3d
const {color} = require('@jscad/scad-api').color

const initializeData = function () {
  // return color([1, 0, 0, 1], cube({size: 100}))
  return require('../../../designs/um2-E3Dv6-holder/index')()
}
// dark bg : [0.211, 0.2, 0.207, 1]
// dark grid :  [1, 1, 1, 0.1],

const viewerOptions = {
  background: [0.211, 0.2, 0.207, 1], // [1, 1, 1, 1],//54, 51, 53
  meshColor: [0.4, 0.6, 0.5, 1],
  gridColor: [1, 1, 1, 0.1],
  singleton: true, // ensures that no matter how many times you call the creator function, you still only get a single instance
  camera: {
    position: [450, 550, 700],
    target: [0, 0, 0],
    limits: {
      maxDistance: 16000,
      minDistance: 0.01
    },
    far: 18000
  },
  controls: {
    zoomToFit: 'all'
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
