const mat4 = require('gl-mat4')

const cameraState = {
  view: mat4.identity(new Float32Array(16)),
  projection: mat4.identity(new Float32Array(16)),
  matrix: mat4.identity(new Float32Array(16)), // not sure if needed
  near: 1, // 0.01,
  far: 1300,
  up: [0, 0, 1],
  // distance: 10.0, // not sure if needed
  eye: new Float32Array(3), // same as position
  position: [150, 250, 200],
  target: [0, 0, 0],
  fov: Math.PI / 4,
  aspect: 1,
  viewport: [0, 0, 0, 0]
}

const cameraDefaults = {

}

function createCamera (regl, props) {

}

function setProjection (camera, input) {
  // context.viewportWidth / context.viewportHeight,
  const aspect = input.width / input.height

  const projection = mat4.perspective([], camera.fov, aspect,
    camera.near,
    camera.far)
  return {projection, aspect}
}

module.exports = {cameraState, setProjection}
