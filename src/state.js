const most = require('most')
const {deeperAssign} = require('./utils')
const entitiesFromSolids = require('./entitiesFromSolids')

const reducers = {
  setEntitiesFromSolids: (state, data, initialState) => {
    return {entities: entitiesFromSolids(initialState, data)}
  }
}

function makeState (actions, initialState) {
  const state$ = most.mergeArray(actions)
    .scan(function (state, action) {
      console.log('SCAAAN', action)
      const updatedData = reducers[action.type](state, action.data, initialState)
      console.log('updatedData', updatedData)
      return deeperAssign(state, updatedData)
    })
    .filter(x => x !== undefined) // WTF !! the supposed inital value of the scan is fired AFTER the others ???
    .multicast()

  return state$
  .tap(x => console.log('emmitting state', x))
}

module.exports = makeState
