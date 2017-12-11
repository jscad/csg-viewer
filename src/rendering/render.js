const makeDrawMesh = require('./drawMesh/index')
// const makeDrawGrid = require('./drawGrid/index')
const renderWrapper = require('./renderWrapper')

const makeDrawMeshNoNormals = require('./drawMeshNoNormals')
const makeDrawAxis = require('./drawAxis')
const makeDrawNormals = require('./drawNormals')

const prepareRender = (regl, params) => {
  const {geometry} = params
  const drawCSG = makeDrawMesh(regl, {geometry})
  // const drawGrid = prepDrawGrid(regl, {fadeOut: true, ticks: 10, size: [1000, 1000]})
  //const drawNormals = makeDrawNormals(regl, {geometry})
  /*const vectorizeText = require('vectorize-text')
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
  // const drawGrid = makeDrawGrid(regl, {size: [1800, 1800], ticks: 10})  

  let command = (props) => {
    const {meshColor, gridColor, background} = props

    renderWrapper(regl)(props, context => {
      regl.clear({
        color: background,
        depth: 1
      })
      drawCSG({color: meshColor})
      // drawTest({color: [1, 0, 0, 1], model: mat4.translate(mat4.create(), mat4.identity([]), [100, 0, 200])})      
      // drawGrid({color: gridColor})
      drawAxis() // needs to be last to be 'on top' of the scene
      //drawNormals()
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
