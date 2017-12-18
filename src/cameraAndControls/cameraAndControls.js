const most = require('most')
const {controlsProps, update, rotate, zoom, pan, zoomToFit, reset} = require('./orbitControls')
const {setProjection} = require('./perspectiveCamera')

function copyAssign (original, newData) {
  // console.log('updated', newData.camera.view, original.camera.view)
  const camera = Object.assign({}, original.camera, newData.camera)
  const controls = Object.assign({}, original.controls, newData.controls)
  return Object.assign({}, original, {camera, controls})
}

function prepareCameraAndControls (actions, initialState) {
  const camcontrolsState$ = most.mergeArray(actions)
  .scan(function (state, action) {
    //console.log('SCAAAN', action)
    const reducers = {
      undefined: (state) => state, // no op
      resize: ({camera}, sizes) => ({camera: setProjection(camera, sizes)}),
      rotate: (state, angles) => rotate(state, angles),
      zoom: (state, zooms) => zoom(state, zooms),
      pan: (state, delta) => pan(state, delta),
      zoomToFit: (state) => zoomToFit(state),
      reset: (state, params) => {
        console.log('initalsta', initialState.camera)
        let resetState = copyAssign(state, reset(state, initialState))
        //resetState = copyAssign(resetState, update(resetState))
        // resetState = nestedObjectAssign({}, resetState, update(resetState.controls, resetState.camera))
        // resetState = Object.assign({}, {camera, controls}, {camera: resetState.camera, controls: resetState.controls})
        // then apply zoomToFIt
        return resetState//zoomToFit(resetState.controls, resetState.camera)
      },
      setFromParams: ({controls, camera}, params) => {
        let result = {
          controls: {},
          camera: {}
        }
        if (params && 'controls' in params) {
          result.controls = params.controls
        }
        if (params && 'entity' in params) {
          result.controls.entity = params.entity
        }
        if (params && 'camera' in params) {
          result.camera = params.camera
        }
        return result
      }
    }
    const updatedData = copyAssign(state, reducers[action.type](state, action.data))
    const newState = copyAssign(updatedData, update(updatedData))
    return newState
  }, initialState)
  return camcontrolsState$
}

module.exports = prepareCameraAndControls
