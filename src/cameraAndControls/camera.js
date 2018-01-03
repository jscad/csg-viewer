
const vec3 = require('gl-vec3')
const mat4 = require('gl-mat4')

function fromOrthographicToPerspective (orthographicCamera, perspecitveCamera) {
  const {near, far, fov, zoom} = orthographicCamera
  return Object.assign({}, perspecitveCamera, {near, far, fov: fov / zoom})
  // this.cameraP.updateProjectionMatrix();
  // this.projectionMatrix = this.cameraP.projectionMatrix;
}

function fromPerspectiveToOrthographic (perspecitveCamera, orthographicCamera) {
  const {fov, aspect} = perspecitveCamera

  // set the orthographic view rectangle to 0,0,width,height
  // see here : http://stackoverflow.com/questions/13483775/set-zoomvalue-of-a-perspective-equal-to-perspective
  const target = perspecitveCamera.target === undefined ? vec3.create() : perspecitveCamera.target

  const distance = vec3.length(vec3.subtract([], perspecitveCamera.position, perspecitveCamera.target)) * 0.3
  const width = Math.tan(fov) * distance * aspect
  const height = Math.tan(fov) * distance

  const halfWidth = width
  const halfHeight = height

  const left = halfWidth
  const right = -halfWidth
  const top = -halfHeight
  const bottom = halfHeight

  // we re-use near, far, & projection matrix of orthographicCamera
  return Object.assign({}, orthographicCamera, {left, right, top, bottom, target})
}

function toPerspectiveView ({camera}) {
  const offsetToTarget = vec3.distance(camera.position, camera.target)
  const distance = offsetToTarget
  const position = [distance, distance, distance]
  const view = mat4.lookAt(mat4.create(), position, camera.target, camera.up)

  return {view, position}
}

function toPresetView (viewName, {camera}) {
  const presets = {
    'top': [0, 0, 1],
    'bottom': [0, 0, -1],
    'front': [0, 1, 0],
    'back': [0, -1, 0],
    'left': [1, 0, 0],
    'right': [-1, 0, 0],
    undefined: [0, 0, 0]
  }

  const offsetToTarget = vec3.distance(camera.position, camera.target)
  const position = vec3.add([], presets[viewName].map(x => x * offsetToTarget), camera.target)
  const view = mat4.lookAt(mat4.create(), position, camera.target, camera.up)

  return {view, position}
}

module.exports = {toPerspectiveView, toPresetView}
