const most = require('most')
const {controlsProps, controlsState, update, rotate, zoom, pan, zoomToFit, reset} = require('./orbitControls')
const {cameraProps, cameraState, setProjection} = require('./camera')

let subscription

function prepareCameraAndControls (gestures, resize$, container, params, params$) {
  // const defaults = Object.assign({}, cameraState, controlsProps, controlsState)
  // const initialState = Object.assign({}, defaults, params.camera, params.controls)

  // const settings = Object.assign({}, initialState)
  const _controlsState = Object.assign({}, controlsProps, controlsState, params.controls)
  const _cameraState = Object.assign({}, cameraProps, cameraState, params.camera)
  console.log('initialzed controls state', _controlsState)
  console.log('initialzed camera   state', _cameraState)

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
  .combine((_, params) => params, params$)
  .multicast()

  const camcontrolsState$ = most.mergeArray([
    rotations$.map(data => ({type: 'rotate', data})),
    // pan$.map(data => ({type: 'pan', data})),
    // zoom$.map(data => ({type: 'zoom', data})),
    resize$.map(data => ({type: 'resize', data}))
    //reset$.map(data => ({type: 'reset', data})),
    //zoomToFit$.map(data => ({type: 'zoomToFit', data})),
    //params$.map(data => ({type: 'setFromParams', data}))
  ])
  .scan(function (state, action) {
    console.log('SCAAAN', action)
    const mutations = {
      rotate: (camera, angles) => rotate(settings, camera, angles),
      pan: (camera, delta) => pan(settings, camera, delta),
      zoom: (camera, zooms) => zoom(settings, camera, zooms),
      resize: (camera, sizes) => {
        return setProjection(camera, sizes)
      },
      zoomToFit: (camera, params) => {
        return params.controls && params.controls.zoomToFit && params.controls.zoomToFit.targets === 'all'
        ? Object.assign({}, camera, zoomToFit(settings, camera, params.entity))
        : camera
      },
      reset: (camera, params) => {
        camera = Object.assign({}, camera, reset(settings, camera, initialState))
        // then apply zoomToFIt
        camera = Object.assign({}, camera, zoomToFit(settings, camera, params.entity))
        return camera
      }
      /* setFromParams: (camera, params) => {
        return reset(settings, camera, params.camera)
      } */
    }
    const updateData = mutations[action.type] !== undefined ? mutations[action.type](state, action.data) : state
    const newState = Object.assign({}, state, updateData)
    return Object.assign({}, state, update(newState, settings))
  }, initialState)
  .combine((camera, _params) => {
    return Object.assign({}, params, _params, {camera}) // {camera, params}
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
