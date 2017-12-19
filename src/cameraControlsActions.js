const most = require('most')
const {rafStream} = require('./observable-utils/rafStream')
const limitFlow = require('./observable-utils/limitFlow')

function actions (sources) {
  const {gestures, resizes$, params$, data$} = sources

  let rotations$ = gestures.drags
  .filter(x => x !== undefined) // TODO: add this at gestures.drags level
  .map(function (data) {
    let delta = [data.delta.x, data.delta.y]
    const {shiftKey} = data.originalEvents[0]
    if (!shiftKey) {
      return delta
    }
    return undefined
  })
  .filter(x => x !== undefined)
  .map(delta => delta.map(d => d * -Math.PI))
  .map(data => ({type: 'rotate', data}))
  .multicast()

  let pan$ = gestures.drags
  .filter(x => x !== undefined) // TODO: add this at gestures.drags level
  .map(function (data) {
    const delta = [data.delta.x, data.delta.y]
    const {shiftKey} = data.originalEvents[0]
    if (shiftKey) {
      return delta
    }
    return undefined
  })
  .filter(x => x !== undefined)
  .map(data => ({type: 'pan', data}))
  .multicast()

  let zoom$ = gestures.zooms
  .startWith(0) // TODO: add this at gestures.zooms level
  .map(x => -x) // we invert zoom direction
  .filter(x => !isNaN(x)) // TODO: add this at gestures.zooms level
  .skip(1)
  .map(data => ({type: 'zoom', data}))
  .multicast()

// Reset view with a double tap
  let reset$ = gestures.taps
  .filter(taps => taps.nb === 2)
  .sample(params => params, params$)
  .map(data => ({type: 'reset', data}))
  .multicast()

  const onFirstStart$ = resizes$.take(1).multicast() // there is an initial resize event, that we reuse

// zoomToFit main mesh bounds
  const zoomToFit$ = most.mergeArray([
    gestures.taps.filter(taps => taps.nb === 3)
      .map(_ => ({type: 'zoomToFit', data: {when: 'demand'}})),
    onFirstStart$
      .map(_ => ({type: 'zoomToFit', data: {origin: 'start'}})),
    data$
      .map(_ =>({type: 'zoomToFit', data: {origin: 'new-data'}}))
  ])
  .multicast()

  const update$ = rafStream()
    .map(_ => ({type: 'update', data: undefined}))

  return [
    rotations$,
    pan$,
    zoom$,
    reset$,
    zoomToFit$,
    resizes$.map(data => ({type: 'resize', data})),
    update$.thru(limitFlow(33))
  ]
}

module.exports = actions
