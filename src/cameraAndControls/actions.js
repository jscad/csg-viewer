const most = require('most')

function actions (sources) {
  const {gestures, resizes} = sources

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

  let reset$ = gestures.taps
  .filter(taps => taps.nb === 2)
  .sample(params => params, params$)
  .multicast()

  const onFirstStart$ = resize$.take(1).multicast() // there is an initial resize event, that we reuse

// zoomToFit main mesh bounds
  const zoomToFit$ = most.mergeArray([
    gestures.taps.filter(taps => taps.nb === 3)
    // onFirstStart$
  ])
  .combine((_, params) => params, params$)
  /* .map(params => {
    console.log('params in zoomToFit', params.background)
    camera = params.controls && params.controls.zoomToFit && params.controls.zoomToFit.targets === 'all'
      ? Object.assign({}, camera, zoomToFit(settings, camera, params.entity))
      : camera
    return camera
  }) */
  .multicast()


}
