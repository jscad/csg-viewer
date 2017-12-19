const most = require('most')
const {deeperAssign} = require('./utils')
const entitiesFromSolids = require('./entitiesFromSolids')
const prepareRender = require('./rendering/render')

const makeReducers = require('./cameraAndControls/state')

const dataReducers = {
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

function makeState (actions, initialState, regl) {
  const cameraReducers = makeReducers(initialState)
  const reducers = Object.assign({}, dataReducers, cameraReducers)
  console.log('actions', actions)
  console.log('reducers', reducers)

  const state$ = actions
    .scan(function (state, action) {
      const reducer = reducers[action.type] ? reducers[action.type] : (state) => state
      const updatedData = reducer(state, action.data, initialState, regl)
      const newState = deeperAssign(state, updatedData)
      console.log('SCAAAN', action, newState)
      return newState
    }, initialState)
    .filter(x => x !== undefined) // WTF !! the supposed inital value of the scan is fired AFTER the others ???
    .multicast()

  return state$
}

module.exports = makeState
