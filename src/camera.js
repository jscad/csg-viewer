const mat4 = require('gl-mat4')

const cameraDefaults = {

}

function createCamera (regl, props) {

}

function createControls (regl, props) {

}

function setProjection (camera, input) {
  // context.viewportWidth / context.viewportHeight,
  const aspect = input.width / input.height
  
  const projection = mat4.perspective([], camera.fov, aspect,
    camera.near,
    camera.far)
  return {projection, aspect}
}

module.exports = {setProjection}
