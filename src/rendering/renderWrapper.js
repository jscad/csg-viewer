const mat4 = require('gl-mat4')

function renderWrapper (regl, params = {}) {
  const {fbo} = params

  const commandParams = {
    cull: {
      enable: true
    },
    context: {
      lightDir: [0.19, 0.47, 0.29]
    },
    uniforms: {
      view: (context, props) => props.camera.view,
      // projection: (context, props) => mat4.perspective([], props.camera.fov, context.viewportWidth/context.viewportHeight, props.camera.near, props.camera.far), //props.camera.projection,//context.viewportWidth also an alternative?
      projection: (context, props) => props.camera.projection,
      camNear: (context, props) => props.camera.near,
      camFar: (context, props) => props.camera.far,

      lightDir: (context) => context.lightDir || [0, 0, 0],
      lightColor: [1, 0.8, 0],
      lightView: (context) => {
        return mat4.lookAt([], context.lightDir, [0.0, 0.0, 0.0], [0.0, 0.0, 1.0])
      },
      lightProjection: mat4.ortho([], -25, -25, -20, 20, -25, 25),
      ambientLightAmount: 0.8,
      diffuseLightAmount: 2.99
    },
    framebuffer: fbo
  }

  return regl(Object.assign({}, commandParams, params.extras))
}

module.exports = renderWrapper
