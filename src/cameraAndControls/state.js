const {update, rotate, zoom, pan, zoomToFit, reset} = require('./orbitControls')
const {setProjection} = require('./perspectiveCamera')

function copyAssign (original, newData) {
  // console.log('updated', newData.camera.view, original.camera.view)
  const camera = Object.assign({}, original.camera, newData.camera)
  const controls = Object.assign({}, original.controls, newData.controls)
  return Object.assign({}, original, {camera, controls})
}

function makeReducers (initialState) {
  const reducers = {
    undefined: (state) => state, // no op
    update: (state) => {
      return copyAssign(state, update(state))
    },
    resize: (state, sizes) => {
      return copyAssign(state, {camera: setProjection(state.camera, sizes)})
    },
    rotate: (state, angles) => {
      return copyAssign(state, rotate(state, angles))
    },
    zoom: (state, zooms) => {
      return copyAssign(state, zoom(state, zooms))
    },
    pan: (state, delta) => {
      return copyAssign(state, pan(state, delta))
    },
    zoomToFit: (state) => {
      return copyAssign(state, zoomToFit(state))
    },
    reset: (state, params) => {
      let resetState = copyAssign(state, reset(state, initialState))
      // then apply zoomToFIt
      resetState = zoomToFit(resetState)
      return resetState
    }
  }
  return reducers
}

module.exports = makeReducers
