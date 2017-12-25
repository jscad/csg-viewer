
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

function toFrontView ({camera}) {
  const offsetToTarget = vec3.distance(camera.position, camera.target)
  const position = vec3.add([], [0, offsetToTarget, 0], camera.target)
  const view = mat4.lookAt(mat4.create(), position, camera.target, camera.up)

  return {view, position}
}

function toBackView ({camera}) {
  const offsetToTarget = vec3.distance(camera.position, camera.target)
  const position = vec3.add([], [0, -offsetToTarget, 0], camera.target)
  const view = mat4.lookAt(mat4.create(), position, camera.target, camera.up)

  return {view, position}
}

function toTopView ({camera}) {
  const offsetToTarget = vec3.distance(camera.position, camera.target)
  const position = vec3.add([], [0, 0, offsetToTarget], camera.target)
  const view = mat4.lookAt(mat4.create(), position, camera.target, camera.up)

  return {view, position}
}

function toBottomView ({camera}) {
  const offsetToTarget = vec3.distance(camera.position, camera.target)
  const position = vec3.add([], [0, 0, -offsetToTarget], camera.target)
  const view = mat4.lookAt(mat4.create(), position, camera.target, camera.up)

  return {view, position}
}

function toLeftView ({camera}) {
  const offsetToTarget = vec3.distance(camera.position, camera.target)
  const position = vec3.add([], [offsetToTarget, 0, 0], camera.target)
  const view = mat4.lookAt(mat4.create(), position, camera.target, camera.up)

  return {view, position}
}

function toRightView ({camera}) {
  const offsetToTarget = vec3.distance(camera.position, camera.target)
  const position = vec3.add([], [-offsetToTarget, 0, 0], camera.target)
  const view = mat4.lookAt(mat4.create(), position, camera.target, camera.up)

  return {view, position}
}

function toPerspectiveView ({camera}) {
  const offsetToTarget = vec3.distance(camera.position, camera.target)
  const distance = offsetToTarget
  const position = [distance, distance, distance]
  const view = mat4.lookAt(mat4.create(), position, camera.target, camera.up)

  return {view, position}
}

module.exports = {toFrontView, toBackView, toTopView, toBottomView, toRightView, toLeftView, toPerspectiveView}
/* var offset = this.position.clone().sub(this.target)
var nPost = new THREE.Vector3()
nPost.y = -offset.length()
this.position.copy(nPost)
this.lookAt(this.target) */
