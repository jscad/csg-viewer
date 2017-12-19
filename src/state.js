const {deeperAssign} = require('./utils')
const makeCameraAndControlsReducers = require('./cameraControlsReducers')
const makeDataAndParamsReducers = require('./dataParamsReducers')

function makeState (actions, initialState, regl) {
  const cameraControlsReducers = makeCameraAndControlsReducers(initialState, regl)
  const dataParamsReducers = makeDataAndParamsReducers(initialState, regl)
  const reducers = Object.assign({}, dataParamsReducers, cameraControlsReducers)
  console.log('actions', actions)
  console.log('reducers', reducers)

  const state$ = actions
    .scan(function (state, action) {
      const reducer = reducers[action.type] ? reducers[action.type] : (state) => state
      const updatedData = reducer(state, action.data, initialState, regl)
      const newState = deeperAssign(state, updatedData)
      // console.log('SCAAAN', action, newState)
      return newState
    }, initialState)
    .filter(x => x !== undefined) // WTF !! the supposed inital value of the scan is fired AFTER the others ???
    .multicast()

  return state$
}

module.exports = makeState
