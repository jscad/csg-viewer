const most = require('most')
const {controlsProps, controlsState, update, rotate, zoom, pan, zoomToFit, reset} = require('./orbitControls')
const {cameraState, setProjection} = require('./camera')

let subscription

function prepareCameraAndControls (gestures, resize$, container, params, params$) {
  const defaults = Object.assign({}, cameraState, controlsProps, controlsState)
  const initialState = Object.assign({}, defaults, params.camera, params.controls)

  let camera = Object.assign({}, initialState)
  const settings = Object.assign({}, initialState)

  // params$ = params$.skipRepeats()
  // perhaps use skipRepeatsWith

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

  let reset$ = gestures.taps
    .filter(taps => taps.nb === 2)
    .multicast()

  const onFirstStart$ = resize$.take(1).multicast() // there is an initial resize event, that we reuse

  resize$ = resize$
    .map(sizes => {
      camera = Object.assign({}, camera, {viewport: [0, 0, sizes.width, sizes.height]}, setProjection(camera, sizes))
      return camera
    })

  zoom$ = zoom$
    .map(zooms => {
      camera = Object.assign({}, camera, zoom(settings, camera, zooms))
      return camera
    })

  rotations$ = rotations$
    .map(angles => {
      camera = Object.assign({}, camera, rotate(settings, camera, angles))
      return camera
    })

  pan$ = pan$
    .map(delta => {
      camera = Object.assign({}, camera, pan(settings, camera, delta))
      return camera
    })

  // zoomToFit main mesh bounds
  const zoomToFit$ = most.mergeArray([
    gestures.taps.filter(taps => taps.nb === 3),
    onFirstStart$
  ])
  .combine((_, params) => params, params$)
  .map(params => {
    console.log('params in zoomToFit', params.background)
    camera = params.controls && params.controls.zoomToFit && params.controls.zoomToFit.targets === 'all'
      ? Object.assign({}, camera, zoomToFit(settings, camera, params.entity))
      : camera
    return camera
  })
  .multicast()

  // Reset view with a double tap
  reset$ = reset$
    .sample(params => params, params$)
    .map(params => {
      console.log('params for reset', params.background)
      camera = Object.assign({}, camera, reset(settings, camera, initialState))
      // then apply zoomToFIt
      camera = Object.assign({}, camera, zoomToFit(settings, camera, params.entity))
      return camera
    }).multicast()

  let merged$ = most.mergeArray([
    resize$,
    rotations$,
    zoom$,
    pan$,
    zoomToFit$,
    reset$
  ]).multicast()

  merged$ = merged$
    .combine((camera, params) => ({params, camera}), params$)
    .map(({params, camera}) => { // we use the camera state output, not the 'global' state
      console.log('params before render', params.background)
      camera = Object.assign({}, camera, update(camera, settings))
      return Object.assign({}, params, {camera})
    })
    .multicast()
    // .skipRepeats() perhaps use skipRepeatsWith

    // we use a subscription to be able to unsubscribe in case the viewer needs to be recreated
  return (render) => {
    if (subscription) {
      console.log('unsbub')
      subscription.unsubscribe()
    }
    console.log('sub')
    subscription = merged$
      .subscribe({next: render})
  }
}

module.exports = prepareCameraAndControls
