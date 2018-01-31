const mat4 = require('gl-mat4')
const vao = require('vertex-ao')

const vColorVert = `
precision mediump float;

uniform float camNear, camFar;
uniform mat4 model, view, projection, unormal;

attribute vec3 position, normal;
attribute vec4 color;

attribute float ao;
varying float ambientAo;

varying vec3 surfaceNormal, surfacePosition;
varying vec4 _worldSpacePosition;
varying vec4 vColor;

void main() {
  surfacePosition = position;
  surfaceNormal = (unormal * vec4(normal, 1.0)).xyz; //vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
  vec4 worldSpacePosition = model * vec4(position, 1);
  _worldSpacePosition = worldSpacePosition;
  //gl_Position = projection * view * worldSpacePosition;

  vColor = color;

  //ambientAo = (1. - ao) * (0.5 * max(normal.x, 0.) + 0.5);

  vec4 glPosition = projection * view * model * vec4(position, 1);
  gl_Position = glPosition;
  //gl_Position = zBufferAdjust(glPosition, camNear, camFar);
}
`
// NOTE : HEEEERE
const vColorFrag = `
precision mediump float;
varying vec3 surfaceNormal, surfacePosition;

uniform float ambientLightAmount;
uniform float diffuseLightAmount;
uniform float specularLightAmount;

uniform vec3 lightDirection;
uniform vec4 lightColor;
uniform vec3 opacity;
uniform float uMaterialShininess;

varying vec4 vColor;
uniform vec4 ucolor;
uniform float vColorToggler;

uniform vec2 printableArea;
vec4 errorColor = vec4(0.15, 0.15, 0.15, 0.3);//vec4(0.15, 0.15, 0.15, 0.3);
varying vec4 _worldSpacePosition;
varying float ambientAo;

void main () {
  vec4 depth = gl_FragCoord;
  vec4 endColor = vColor * vColorToggler + ucolor * (1.0 - vColorToggler);

  vec3 ambient = ambientLightAmount * endColor.rgb ; //ambientAo * 

  float diffuseWeight = dot(surfaceNormal, lightDirection);
  vec3 diffuse = diffuseLightAmount * endColor.rgb * clamp(diffuseWeight , 0.0, 1.0 );

  //specular
  
  vec4 specularColor = vec4(lightColor);
  vec3 eyeDirection = normalize(surfacePosition.xyz);
  vec3 reflectionDirection = reflect(-lightDirection, surfaceNormal);
  float specularLightWeight = pow(max(dot(reflectionDirection, eyeDirection), 0.0), uMaterialShininess);
  vec3 specular = specularColor.rgb * specularLightWeight * specularLightAmount;

  /*float light2Multiplier = 0.2;
  float diffuseWeight2 = dot(surfaceNormal, vec3(-lightDirection.x, lightDirection.y, lightDirection.z));
  vec3 diffuse2 = diffuseLightAmount * endColor.rgb * clamp(diffuseWeight2 , 0.0, 1.0 ) * light2Multiplier;

  float light3Multiplier = 0.2;  
  float diffuseWeight3 = dot(surfaceNormal, vec3(lightDirection.x, -lightDirection.y, lightDirection.z));
  vec3 diffuse3 = diffuseLightAmount * endColor.rgb * clamp(diffuseWeight3 , 0.0, 1.0 ) * light3Multiplier;

  float light4Multiplier = 0.2;  
  float diffuseWeight4 = dot(surfaceNormal, vec3(-lightDirection.x, -lightDirection.y, lightDirection.z));
  vec3 diffuse4 = diffuseLightAmount * endColor.rgb * clamp(diffuseWeight4 , 0.0, 1.0 ) * light4Multiplier;*/
  
  gl_FragColor = vec4((ambient + diffuse +specular), endColor.a);
  //gl_FragColor = vec4((ambient + diffuse + diffuse2 + diffuse3 + diffuse4), endColor.a);
}
`

const meshFrag = `
precision mediump float;
varying vec3 surfaceNormal;
uniform float ambientLightAmount;
uniform float diffuseLightAmount;
uniform vec4 ucolor;
uniform vec3 lightDirection;
uniform vec3 opacity;

varying vec4 _worldSpacePosition;

uniform vec2 printableArea;

vec4 errorColor = vec4(0.15, 0.15, 0.15, 0.3);

void main () {
  vec4 depth = gl_FragCoord;

  float v = 0.8; // shadow value
  vec4 endColor = ucolor;

  vec3 ambient = ambientLightAmount * endColor.rgb;
  float cosTheta = dot(surfaceNormal, lightDirection);
  vec3 diffuse = diffuseLightAmount * endColor.rgb * clamp(cosTheta , 0.0, 1.0 );

  float cosTheta2 = dot(surfaceNormal, vec3(-lightDirection.x, -lightDirection.y, lightDirection.z));
  vec3 diffuse2 = diffuseLightAmount * endColor.rgb * clamp(cosTheta2 , 0.0, 1.0 );

  gl_FragColor = vec4((ambient + diffuse + diffuse2 * v), endColor.a);
}`

const meshVert = `
precision mediump float;

uniform float camNear, camFar;
uniform mat4 model, view, projection;

attribute vec3 position, normal;

varying vec3 surfaceNormal, surfacePosition;
varying vec4 _worldSpacePosition;

void main() {
  surfacePosition = position;
  surfaceNormal = normal;
  vec4 worldSpacePosition = model * vec4(position, 1);
  _worldSpacePosition = worldSpacePosition;

  vec4 glPosition = projection * view * model * vec4(position, 1);
  gl_Position = glPosition;
}
`

const drawMesh = function (regl, params = {extras: {}}) {
  const {buffer} = regl
  const defaults = {
    useVertexColors: true,
    dynamicCulling: false,
    geometry: undefined
  }
  const {geometry, dynamicCulling, useVertexColors} = Object.assign({}, defaults, params)

  let ambientOcclusion // = vao(geometry.indices, geometry.positions, 64, 64)
  ambientOcclusion = regl.buffer([])

  // vertex colors or not ?
  const hasIndices = !!(geometry.indices && geometry.indices.length > 0)
  const hasNormals = !!(geometry.normals && geometry.normals.length > 0)
  const hasVertexColors = !!(useVertexColors && geometry.colors && geometry.colors.length > 0)
  const cullFace = dynamicCulling ? function (context, props) {
    const isOdd = ([props.model[0], props.model[5], props.model[10]].filter(x => x < 0).length) & 1 // count the number of negative components & deterine if that is odd or even
    return isOdd ? 'front' : 'back'
  } : 'back'

  const vert = hasVertexColors ? vColorVert : meshVert
  const frag = hasVertexColors ? vColorFrag : meshFrag

  let commandParams = {
    vert,
    frag,

    uniforms: {
      model: (context, props) => props && props.model ? props.model : mat4.identity([]),
      ucolor: (context, props) => props && props.color ? props.color : [1, 1, 1, 1],
      // semi hack, woraround to enable/disable vertex colors!!!
      vColorToggler: (context, props) => (props && props.useVertexColors && props.useVertexColors === true) ? 1.0 : 0.0,
      // experimental
      unormal: (context, props) => {
        const model = props.model
        const modelViewMatrix = mat4.multiply(mat4.create(), model, props.camera.view)
        const normalMatrix = mat4.create()
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)
        return normalMatrix
      }
    },
    attributes: {
      position: buffer(geometry.positions),
      ao: ambientOcclusion
    },
    cull: {
      enable: true,
      face: cullFace
    },
    blend: {
      enable: true,
      func: {
        src: 'src alpha',
        dst: 'one minus src alpha'
      }
    },
    primitive: (context, props) => props && props.primitive ? props.primitive : 'triangles'
  }

  if (geometry.cells) {
    commandParams.elements = geometry.cells
  } else if (hasIndices) {
    // FIXME: not entirely sure about all this
    const indices = geometry.indices
    /* let type
    if (indices instanceof Uint32Array && regl.hasExtension('oes_element_index_uint')) {
      type = 'uint32'
    }else if (indices instanceof Uint16Array) {
      type = 'uint16'
    } else {
      type = 'uint8'
    } */

    commandParams.elements = regl.elements({
      // type,
      data: indices
    })
  } else if (geometry.triangles) {
    commandParams.elements = geometry.triangles
  } else {
    commandParams.count = geometry.positions.length / 3
  }

  if (hasNormals) {
    commandParams.attributes.normal = buffer(geometry.normals)
  }
  if (hasVertexColors) {
    commandParams.attributes.color = buffer(geometry.colors)
  }

  // Splice in any extra params
  commandParams = Object.assign({}, commandParams, params.extras)
  return regl(commandParams)
}

module.exports = drawMesh
