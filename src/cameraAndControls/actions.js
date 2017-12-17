const most = require('most')

function actions (sources) {
  const {gestures, resizes$, params$} = sources

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
  .multicast()

  let zoom$ = gestures.zooms
  .startWith(0) // TODO: add this at gestures.zooms level
  .map(x => -x) // we invert zoom direction
  .filter(x => !isNaN(x)) // TODO: add this at gestures.zooms level
  .multicast()
  .skip(1)

// Reset view with a double tap
  let reset$ = gestures.taps
  .filter(taps => taps.nb === 2)
  .sample(params => params, params$)
  .multicast()

  const onFirstStart$ = resizes$.take(1).multicast() // there is an initial resize event, that we reuse

// zoomToFit main mesh bounds
  const zoomToFit$ = most.mergeArray([
    gestures.taps.filter(taps => taps.nb === 3),
    onFirstStart$
  ])
  .combine(params => params, params$)
  .multicast()

  return [
    rotations$.map(data => ({type: 'rotate', data})),
    pan$.map(data => ({type: 'pan', data})),
    zoom$.map(data => ({type: 'zoom', data})),
    reset$.map(data => ({type: 'reset', data})),
    zoomToFit$.map(data => ({type: 'zoomToFit', data})),
    resizes$.map(data => ({type: 'resize', data})),
    params$.map(data => ({type: 'setFromParams', data}))
  ]
}

module.exports = actions
