const mat4 = require('gl-mat4')
const most = require('most')
const {update, rotate, zoom, pan, zoomToFit, reset, controlProps} = require('./orbitControls')
const {setProjection} = require('./camera')

const controlsDefaults = {
  userControl: {
    zoom: true,
    zoomSpeed: 1.0,
    rotate: true,
    rotateSpeed: 1.0,
    pan: true,
    panSpeed: 2.0
  },
  autoRotate: {
    enabled: false,
    speed: 2.0 // 30 seconds per round when fps is 60
  },
  autoAdjustPlanes: true, // adjust near & far planes when zooming in &out
  limits: {
    minDistance: 130,
    maxDistance: 2800
  },
  EPS: 0.000001,
  drag: 0.27, // Decrease the momentum by 1% each iteration
  // orbit controls state
  thetaDelta: 0,
  phiDelta: 0,
  scale: 1
}
const cameraDefaults = {
  matrix: mat4.identity(new Float32Array(16)),
  view: mat4.identity(new Float32Array(16)),
  projection: mat4.identity(new Float32Array(16)),
  near: 1, // 0.01,
  far: 3800,
  up: [0, 0, 1],
  distance: 10.0,
  eye: new Float32Array(3), // same as position
  position: [150, 250, 200],
  target: [0, 0, 0],
  fov: Math.PI / 4,
  aspect: 1,
  viewport: [0, 0, 0, 0]
}

let subscription

function prepareCameraAndControls (gestures, resize$, container, params, params$) {
  const defaults = Object.assign({}, cameraDefaults, controlsDefaults)
  const initialState = Object.assign({}, defaults, params.camera, params.controls)

  let camera = Object.assign({}, initialState)
  const settings = Object.assign({}, initialState)

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

  let reset$ = gestures.taps
    .filter(taps => taps.nb === 2)

  const onFirstStart$ = resize$.take(1).multicast() // there is an initial resize event, that we reuse

  let zoom$ = gestures.zooms
    .startWith(0) // TODO: add this at gestures.zooms level
    .map(x => -x) // we invert zoom direction
    .filter(x => !isNaN(x)) // TODO: add this at gestures.zooms level
    .multicast()

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
    camera = params.controls && params.controls.zoomToFit && params.controls.zoomToFit === 'all'
      ? Object.assign({}, camera, zoomToFit(settings, camera, params.entity))
      : camera
    return camera
  })
  .multicast()

  // Reset view with a double tap
  reset$ = reset$
    .sample(params => params, params$)
    .map(params => {
      camera = Object.assign({}, camera, reset(settings, camera, initialState))
      // then apply zoomToFIt
      camera = Object.assign({}, camera, zoomToFit(settings, camera, params.entity))
      return camera
    })

  let merged$ = most.mergeArray([
    resize$,
    rotations$,
    zoom$,
    pan$,
    zoomToFit$,
    reset$
  ]).multicast()

  merged$ = merged$
    .sample((params, camera) => ({params, camera}), params$, merged$)
    .map(({params, camera}) => {// we use the camera state output, not the 'global' state
      camera = Object.assign({}, camera, update(camera, settings))
      return Object.assign({}, params, {camera})
    })

    // we use a subscription to be able to unsubscribe in case the viewer needs to be recreated
  return (render) => {
    if (subscription) {
      subscription.unsubscribe()
    }
    subscription = merged$
      .multicast()
      .subscribe({next: render})
  }
}

module.exports = prepareCameraAndControls
