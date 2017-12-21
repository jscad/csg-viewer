const makeDrawMesh = require('./drawMesh/index')
const makeDrawGrid = require('./drawGrid/index')
const renderWrapper = require('./renderWrapper')

const makeDrawMeshNoNormals = require('./drawMeshNoNormals')
const makeDrawAxis = require('./drawAxis')
const makeDrawNormals = require('./drawNormals')

const prepareRender = (regl, params) => {
  const {entities} = params
  const drawCSGs = entities
    .map(e => makeDrawMesh(regl, {geometry: e.geometry}))
  // const drawGrid = prepDrawGrid(regl, {fadeOut: true, ticks: 10, size: [1000, 1000]})
  // const drawNormals = makeDrawNormals(regl, {geometry})
  /* const vectorizeText = require('vectorize-text')
  const complex = vectorizeText('Hello world! 你好', {
    triangles: true,
    width: 500,
    textBaseline: 'hanging'
  })

  complex.positions = complex.positions.map(point => [point[0], point[1], 0]) */

  const cube = {positions: [
    0, 0, 0,
    0, 100, 0,
    0, 100, 100],

    cells: [0, 1, 2]
  }

  const drawTest = makeDrawMeshNoNormals(regl, {geometry: cube})
  const drawAxis = makeDrawAxis(regl, {})
  const drawGrid = makeDrawGrid(regl, {size: [1800, 1800], ticks: 10})

  let command = (props) => {
    // console.log('params in render', props)
    const {meshColor, background, camera} = props

    const color = meshColor
    const useVertexColors = !props.overrideOriginalColors

    renderWrapper(regl)(props, context => {
      regl.clear({
        color: background,
        depth: 1
      })
      drawCSGs.forEach((drawCSG, index) => {
        const entity = entities[index]
        const primitive = entity.type === '2d' ? 'lines' : 'triangles'
        const model = entity.transforms.matrix
        drawCSG({color, primitive, useVertexColors, camera, model})
      })
      // drawTest({color: [1, 0, 0, 1], model: mat4.translate(mat4.create(), mat4.identity([]), [100, 0, 200])})
      if (props.grid.show) {
        drawGrid({color: props.grid.color})
        // console.log('gridColor', props.grid.color, props)
      }
      if (props.axes.show) {
        drawAxis() // needs to be last to be 'on top' of the scene
      }

      // drawNormals()
    })
  }
  return function render (data) {
    command(data)
    // tick += 0.01
    // for stats, resizing etc
    // regl.poll()
  }
}

module.exports = prepareRender
