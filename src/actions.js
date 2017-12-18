// const limitFlow = require('./observable-utils/limitFlow')

function actions (sources) {
  const {data$} = sources

  const setEntitiesFromSolids$ = data$
    // .thru(limitFlow(800))
    /* .take(4)
    .merge(
      data$.debounce(100)
    ) */
    .filter(data => data !== undefined && data.solids)
    .multicast()
    .map(data => ({type: 'setEntitiesFromSolids', data: data.solids}))

  return [
    setEntitiesFromSolids$
  ]
}

module.exports = actions
