const entitiesFromSolids = require('./entitiesFromSolids')
const prepareRender = require('./rendering/render')

function makeReducers (initialState, regl) {
  const reducers = {
    setEntitiesFromSolids: (state, data, initialState, regl) => {
      const entities = entitiesFromSolids(initialState, data)
      const render = prepareRender(regl, Object.assign({}, state, {entities}))
      return {
        entities,
        render
      }
    },
    updateParams: (state, data) => {
      return data
    }
  }
  return reducers
}

module.exports = makeReducers
