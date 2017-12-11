const vec3 = require('gl-vec3')
const mat4 = require('gl-mat4')
const {max, min, sqrt, PI, sin, cos, atan2} = Math

// TODO: make it more data driven ?
/*
setFocus => modify the focusPoint input
rotate => modify the angle input

*/
/* cameras are assumed to have:
 projection
 view
 target (focal point)
 eye/position
 up
*/
// TODO:  multiple data, sometimes redundant, needs simplification
/*
- camera state
- camera props

- controls state
- controls props

- other

*/

const controlProps = {
  userControl: {
    zoom: true,
    zoomSpeed: 1.0,
    rotate: true,
    rotateSpeed: 1.0,
    pan: true,
    panSpeed: 1.0
  },
  autoRotate: {
    enabled: false,
    speed: 2.0 // 30 seconds per round when fps is 60
  },
  autoAdjustPlanes: true // adjust near & far planes when zooming in &out
}

const controlsState = {
  // orbit controls state
  thetaDelta: 0,
  phiDelta: 0,
  scale: 1
}

const cameraSettings = {
  limits: {
    minDistance: 30,
    maxDistance: 800
  },
  EPS: 0.000001,
  drag: 0.27 // Decrease the momentum by 1% each iteration
}

const cameraState = {
  view: mat4.identity(new Float32Array(16)),
  projection: mat4.identity(new Float32Array(16)),
  near: 1, // 0.01,
  far: 1300,
  up: [0, 0, 1],
  // distance: 10.0,
  eye: new Float32Array(3), // same as position
  position: [150, 250, 200],
  target: [0, 0, 0],
  fov: Math.PI / 4,
  aspect: 1
}

const defaultState = Object.assign({}, {cameraState, controlsState})
const defaultSettings = Object.assign({}, {cameraSettings, controlProps})

function update (state = defaultState, settings = defaultSettings) {
  // custom z up is settable, with inverted Y and Z (since we use camera[2] => up)
  const camera = state
  const {EPS, up, drag} = settings
  let {position, target, matrix, view} = camera

  let curThetaDelta = camera.thetaDelta
  let curPhiDelta = camera.phiDelta
  let curScale = camera.scale

  let offset = vec3.subtract([], position, target)
  let theta
  let phi

  // console.log('target', target)
  // console.log(matrix)

  if (up[2] === 1) {
    // angle from z-axis around y-axis, upVector : z
    theta = atan2(offset[0], offset[1])
    // angle from y-axis
    phi = atan2(sqrt(offset[0] * offset[0] + offset[1] * offset[1]), offset[2])
  } else {
    // in case of y up
    theta = atan2(offset[0], offset[2])
    phi = atan2(sqrt(offset[0] * offset[0] + offset[2] * offset[2]), offset[1])
  // curThetaDelta = -(curThetaDelta)
  }

  if (settings.autoRotate.enabled && settings.userControl.rotate) {
    curThetaDelta += 2 * Math.PI / 60 / 60 * settings.autoRotate.speed // arbitrary, kept for backwards compatibility
  }

  theta += curThetaDelta
  phi += curPhiDelta

  // restrict phi to be betwee EPS and PI-EPS
  phi = max(EPS, min(PI - EPS, phi))
  // multiply by scaling effect and restrict radius to be between desired limits
  const radius = max(settings.limits.minDistance, min(settings.limits.maxDistance, vec3.length(offset) * curScale))

  if (up[2] === 1) {
    offset[0] = radius * sin(phi) * sin(theta)
    offset[2] = radius * cos(phi)
    offset[1] = radius * sin(phi) * cos(theta)
  } else {
    offset[0] = radius * sin(phi) * sin(theta)
    offset[1] = radius * cos(phi)
    offset[2] = radius * sin(phi) * cos(theta)
  }

  let newPosition = vec3.add(vec3.create(), target, offset)
  let newView = mat4.lookAt(view, newPosition, target, up)

  // temporary setup for camera 'move/zoom to fit'
  let near = camera.near
  let projection = camera.projection

  const dragEffect = 1 - max(min(drag, 1.0), 0.01)
  const positionChanged = vec3.distance(position, newPosition) > 0 // TODO optimise

  /* let newMatrix = mat4.create()
  newMatrix = mat4.lookAt(newMatrix, newPosition, target, up)
  newMatrix = mat4.translate(matrix, matrix, newPosition) */

  // update camera matrix
  // let quaternion = quatFromRotationMatrix(mat4.lookAt(mat4.create(), [0, 0, 0], target, up))
  // let newMatrix = composeMat4(mat4.create(), newPosition, quaternion, [1, 1, 1])

  // view = newMatrix
  return {
    changed: positionChanged,
    thetaDelta: curThetaDelta * dragEffect,
    phiDelta: curPhiDelta * dragEffect,
    scale: 1,

    position: newPosition,
    near,
    projection,
    view: newView
    // matrix: newMatrix
  }
}

/**
  * compute camera state to rotate the camera
  * @param {Object} params the camera parameters
  * @param {Object} camera the camera data/state
  * @param {Float} angle value of the angle to rotate
  * @return {Object} the updated camera data/state
*/
function rotate (params, camera, angle) {
  const reductionFactor = 500
  let {
    thetaDelta,
    phiDelta
  } = camera

  if (params.userControl.rotate) {
    thetaDelta += (angle[0] / reductionFactor)
    phiDelta += (angle[1] / reductionFactor)
  }

  return {
    thetaDelta,
    phiDelta
  }
}

/**
  * compute camera state to zoom the camera
  * @param {Object} params the camera parameters
  * @param {Object} camera the camera data/state
  * @param {Float} zoomDelta value of the zoom
  * @return {Object} the updated camera data/state
*/
function zoom (params, camera, zoomDelta = 0) {
  let {scale} = camera

  if (params.userControl.zoom && camera && zoomDelta !== undefined && zoomDelta !== 0 && !isNaN(zoomDelta)) {
    const sign = Math.sign(zoomDelta) === 0 ? 1 : Math.sign(zoomDelta)
    zoomDelta = (zoomDelta / zoomDelta) * sign * 0.01// params.userControl.zoomSpeed
    // adjust zoom scaling based on distance : the closer to the target, the lesser zoom scaling we apply
    //zoomDelta *= Math.exp(Math.max(camera.scale * 0.05, 1))
    // updated scale after we will apply the new zoomDelta to the current scale
    const newScale = (zoomDelta + camera.scale)
    // updated distance after the scale has been updated, used to prevent going outside limits
    const newDistance = vec3.distance(camera.position, camera.target) * newScale

    if (newDistance > params.limits.minDistance && newDistance < params.limits.maxDistance) {
      scale += zoomDelta
    }

    /* if (params.autoAdjustPlanes) {
      // these are empirical values , after a LOT of testing
      const distance = vec3.squaredDistance(camera.target, camera.position)
      camera.near = Math.min(Math.max(5, distance * 0.0015), 100)
    } */
  }
  return {
    scale
  }
}

/**
  * compute camera state to pan the camera
  * @param {Object} params the camera parameters
  * @param {Object} camera the camera data/state
  * @param {Float} delta value of the raw pan delta
  * @return {Object} the updated camera data/state
*/
function pan (params, camera, delta) {
  const unproject = require('camera-unproject')
  const {projection, view, viewport} = camera
  const combinedProjView = mat4.multiply([], projection, view)
  const invProjView = mat4.invert([], combinedProjView)

  const panStart = [
    viewport[2],
    viewport[3],
    0
  ]
  const panEnd = [
    viewport[2] - delta[0],
    viewport[3] + delta[1],
    0
  ]
  const unPanStart = unproject([], panStart, viewport, invProjView)
  const unPanEnd = unproject([], panEnd, viewport, invProjView)
  // TODO scale by the correct near/far value instead of 1000 ?
  // const planesDiff = camera.far - camera.near
  const offset = vec3.subtract([], unPanStart, unPanEnd).map(x => x * 1000 * camera.userControl.panSpeed * camera.scale)

  return {
    position: vec3.add(vec3.create(), camera.position, offset),
    target: vec3.add(vec3.create(), camera.target, offset)
  }
}

/**
  * compute camera state to 'fit' an object on screen
  * Note1: this is a non optimal but fast & easy implementation
  * @param {Object} params the camera parameters
  * @param {Object} camera the camera data/state
  * @param {Object} entity an object containing a 'bounds' property for bounds information
  * @return {Object} the updated camera data/state
*/
function zoomToFit (params, camera, entity) {
  // our camera.fov is already in radian, no need to convert
  const {fov, target, position} = camera
  const {bounds} = entity

  /*
    - x is scaleForIdealDistance
    - currentDistance is fixed
    - how many times currentDistance * x = idealDistance
    So
    x = idealDistance / currentDistance
  */
  const idealDistanceFromCamera = (bounds.dia) / Math.tan(fov / 2.0)
  const currentDistance = vec3.distance(target, position)
  const scaleForIdealDistance = idealDistanceFromCamera / currentDistance

  return {
    target: bounds.center,
    scale: scaleForIdealDistance
  }
}

/**
  * compute camera state to 'reset it' to the given state
  * Note1: this is a non optimal but fast & easy implementation
  * @param {Object} params the camera parameters
  * @param {Object} camera the camera data/state
  * @param {Object} desiredState the state to reset the camera to: defaults to default values
  * @return {Object} the updated camera data/state
*/
function reset (params, camera, desiredState) {
  return Object.assign({}, camera, {
    position: desiredState.position,
    target: desiredState.target,

    thetaDelta: desiredState.thetaDelta,
    phiDelta: desiredState.phiDelta,
    scale: desiredState.scale,

    projection: mat4.perspective([], camera.fov, camera.aspect, camera.near, camera.far),
    view: desiredState.view
  })
}

// FIXME: upgrade or obsolete
function setFocus (params, camera, focusPoint) {
  const sub = (a, b) => a.map((a1, i) => a1 - b[i])
  const add = (a, b) => a.map((a1, i) => a1 + b[i]) // NOTE: NO typedArray.map support on old browsers, polyfilled
  const camTarget = camera.target
  const diff = sub(focusPoint, camTarget) // [ focusPoint[0] - camTarget[0],
  const zOffset = [0, 0, diff[2] * 0.5]
  camera.target = add(camTarget, zOffset)
  camera.position = add(camera.position, zOffset)
  return camera

  // old 'zoom to fit' update code
  /* if (targetTgt && positionTgt) {
    const posDiff = vec3.subtract([], positionTgt, newPosition)
    const tgtDiff = vec3.subtract([], targetTgt, newTarget)
    // console.log('posDiff', newPosition, positionTgt, newTarget, targetTgt)
    if (vec3.length(posDiff) > 0.1 && vec3.length(tgtDiff) > 0.1) {
      newPosition = vec3.scaleAndAdd(newPosition, newPosition, posDiff, 0.1)
      newTarget = vec3.scaleAndAdd(newTarget, newTarget, tgtDiff, 0.1)
    }

    if (settings.autoAdjustPlanes) {
      var distance = vec3.squaredDistance(newTarget, newPosition)
      near = Math.min(Math.max(5, distance * 0.0015), 100) // these are empirical values , after a LOT of testing
      projection = mat4.perspective([], camera.fov, camera.aspect, camera.near, camera.far)
    }
  } */
}
module.exports = {
  controlProps,
  update, rotate, zoom, pan, zoomToFit, reset
}
