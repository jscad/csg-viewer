const entitiesFromSolids = require('./entitiesFromSolids')
const prepareRender = require('./rendering/render')

function makeReducers (initialState, regl) {
  const reducers = {
    setEntitiesFromSolids: (state, data, initialState, regl) => {
      const entities = entitiesFromSolids(initialState, data)
      // we need to update the render function to provide the new geometry data from entities
      const render = prepareRender(regl, Object.assign({}, state, {entities}))
      return {
        entities,
        render
      }
    },
    updateParams: (state, data) => {
      // console.log('updateParams', data)
      if ('camera' in data) {
        // console.log('camera')
        if (data.camera && data.camera.position && !Array.isArray(data.camera.position)) {
          const {toPresetView} = require('./cameraAndControls/camera')
          const viewPresets = ['top', 'bottom', 'front', 'back', 'left', 'right']
          if (viewPresets.includes(data.camera.position)) {
            const {merge} = require('./utils')
            data.camera = merge({}, data.camera, toPresetView(data.camera.position, state))
          } else {
            // data.camera.position = state.camera.position
            throw new Error(`Unhandled camera position "${data.camera.position}" passed to viewer`)
          }
        }
      }
      return data
    }
  }
  return reducers
}

module.exports = makeReducers
