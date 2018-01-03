const entitiesFromSolids = require('./entitiesFromSolids')

function makeReducers (initialState, regl) {
  const reducers = {
    setEntitiesFromSolids: (state, data, initialState, regl) => {
      const entities = entitiesFromSolids(initialState, data)
      // we need to update the render function to provide the new geometry data from entities
      // const render = prepareRender(regl, Object.assign({}, state, {entities}))
      const makeDrawMesh = require('./rendering/drawMesh/index')
      const drawCSGs = entities
        .map(e => makeDrawMesh(state.regl, {geometry: e.geometry}))
      return {
        entities,
        drawCommands: {
          drawCSGs
        }
      }
    },
    updateParams: (state, data) => {
      // console.log('updateParams', data)
      if ('camera' in data) {
        // to enable camera position from preset names
        if (data.camera && data.camera.position && !Array.isArray(data.camera.position)) {
          const {toPresetView} = require('./cameraAndControls/camera')
          const viewPresets = ['top', 'bottom', 'front', 'back', 'left', 'right']
          if (viewPresets.includes(data.camera.position)) {
            const {merge} = require('./utils')
            data.camera = merge({}, data.camera, toPresetView(data.camera.position, state))
          } else {
            throw new Error(`Unhandled camera position "${data.camera.position}" passed to viewer`)
          }
        }
      }
      if ('grid' in data) {
        if (data.grid && data.grid.size) {
          const {merge} = require('./utils')
          const makeDrawGrid = require('./rendering/drawGrid/multi')
          const {ticks, size} = Object.assign([], state.grid, data.grid)
          const drawGrid = makeDrawGrid(state.regl, {size, ticks})
          data.drawCommands = merge({}, state.drawCommands, {drawGrid})
        }
      }
      return data
    }
  }
  return reducers
}

module.exports = makeReducers
