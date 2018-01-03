const {update, rotate, zoom, pan, zoomToFit, reset} = require('./cameraAndControls/orbitControls')
const {setProjection} = require('./cameraAndControls/perspectiveCamera')
const {merge} = require('./utils')
const {toPresetView, toPerspectiveView} = require('./cameraAndControls/camera')

function makeReducers (initialState) {
  // make sure to actually save the initial state, as it might get mutated
  initialState = JSON.parse(JSON.stringify(initialState))
  const reducers = {
    undefined: (state) => state, // no op
    update: (state) => {
      return merge({}, state, update(state))
    },
    resize: (state, sizes) => {
      return merge({}, state, {camera: setProjection(state.camera, sizes)})
    },
    rotate: (state, angles) => {
      return merge({}, state, rotate(state, angles))
    },
    zoom: (state, zooms) => {
      return merge({}, state, zoom(state, zooms))
    },
    pan: (state, delta) => {
      return merge({}, state, pan(state, delta))
    },
    zoomToFit: (state, when) => {
      return merge({}, state, zoomToFit(state))
    },
    reset: (state, params) => {
      let resetState = merge({}, state, reset(state, initialState))
      // then apply zoomToFIt
      resetState = zoomToFit(resetState)
      return resetState
    },
    toPresetView: (state, viewName) => {
      const newState = merge({}, state, {camera: toPresetView(viewName, state)})
      return newState
    },
    toPerspectiveView: (state, params) => {
      return merge({}, state, {camera: toPerspectiveView(state)})
    },
    toOrthoView: (state, params) => {
      return merge({}, state, {})
    }
  }
  return reducers
}

module.exports = makeReducers
