const most = require('most')
const {controlsProps, controlsState, update, rotate, zoom, pan, zoomToFit, reset} = require('./orbitControls')
const {cameraProps, cameraState, setProjection} = require('./perspectiveCamera')

function copyAssign (original, newData) {
  // console.log('updated', newData.camera.view, original.camera.view)
  const camera = Object.assign({}, original.camera, newData.camera)
  const controls = Object.assign({}, original.controls, newData.controls)
  return Object.assign({}, original, {camera, controls})
}

function prepareCameraAndControls (gestures, resize$, container, params, params$) {
  const _controlsState = Object.assign({}, controlsProps, controlsState, params.controls)
  const _cameraState = Object.assign({}, cameraProps, cameraState, params.camera)
  // console.log('initialzed controls state', _controlsState)
  // console.log('initialzed camera   state', _cameraState)

  const initialState = Object.assign({}, {controls: _controlsState, camera: _cameraState})
  console.log('initalsta', initialState.camera)
  
  let subscription

  // params$ = params$.skipRepeats()
  // .skipRepeats() perhaps use skipRepeatsWith */

  let rotations$ = gestures.drags
    .filter(x => x !== undefined) // TODO: add this at gestures.drags level
    .map(function (data) {
      let delta = [data.delta.x, data.delta.y]
      const {shiftKey} = data.originalEvents[0]
      if (!shiftKey) {
        return delta
      }
      return undefined
    })
    .filter(x => x !== undefined)
    .map(delta => delta.map(d => d * -Math.PI))
    .multicast()

  let pan$ = gestures.drags
    .filter(x => x !== undefined) // TODO: add this at gestures.drags level
    .map(function (data) {
      const delta = [data.delta.x, data.delta.y]
      const {shiftKey} = data.originalEvents[0]
      if (shiftKey) {
        return delta
      }
      return undefined
    })
    .filter(x => x !== undefined)
    .multicast()

  let zoom$ = gestures.zooms
    .startWith(0) // TODO: add this at gestures.zooms level
    .map(x => -x) // we invert zoom direction
    .filter(x => !isNaN(x)) // TODO: add this at gestures.zooms level
    .multicast()
    .skip(1)

  // Reset view with a double tap
  let reset$ = gestures.taps
    .filter(taps => taps.nb === 2)
    .sample(params => params, params$)
    .multicast()

  const onFirstStart$ = resize$.take(1).multicast() // there is an initial resize event, that we reuse

  // zoomToFit main mesh bounds
  const zoomToFit$ = most.mergeArray([
    gestures.taps.filter(taps => taps.nb === 3),
    onFirstStart$
  ])
  .combine(params => params, params$)
  .multicast()

  const camcontrolsState$ = most.mergeArray([
    resize$.map(data => ({type: 'resize', data})),
    rotations$.map(data => ({type: 'rotate', data})),
    pan$.map(data => ({type: 'pan', data})),
    zoom$.map(data => ({type: 'zoom', data})),
    zoomToFit$.map(data => ({type: 'zoomToFit', data})),
    reset$.map(data => ({type: 'reset', data})),
    params$.map(data => ({type: 'setFromParams', data}))
  ])
  .scan(function (state, action) {
    //console.log('SCAAAN', action)
    const mutations = {
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
    const updatedData = copyAssign(state, mutations[action.type](state, action.data))
    const newState = copyAssign(updatedData, update(updatedData))
    return newState
  }, initialState)
  .combine((state, _params) => {
    return Object.assign({}, params, _params, state) // {camera, params}
  }, params$)
  .multicast()

  // we use a subscription to be able to unsubscribe in case the viewer needs to be recreated
  return (render) => {
    if (subscription) {
      subscription.unsubscribe()
    }
    subscription = camcontrolsState$// merged$
      .subscribe({next: render})
  }
}

module.exports = prepareCameraAndControls
