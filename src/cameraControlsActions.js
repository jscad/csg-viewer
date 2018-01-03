const most = require('most')
const {rafStream} = require('./observable-utils/rafStream')
const limitFlow = require('./observable-utils/limitFlow')

function actions (sources) {
  const {gestures, params$, data$, state$} = sources

  const keyDowns$ = most.fromEvent('keydown', document)
  // keyDowns$.forEach(e => console.log('keydown', e))

  const resizes$ = sources.resizes$
    .map(data => ({type: 'resize', data}))
    .multicast()

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

// Reset view with a double tap/ when data changed
  let reset$ = most.mergeArray([
    gestures.taps
      .filter(taps => taps.nb === 2)
      .map(data => ({type: 'reset', data}))
      .multicast(),
    state$
      .filter(state => state.behaviours.resetViewOn.includes('new-entities'))
      .map(state => state.entities).skipRepeatsWith(areEntitiesIdentical)
      .map(_ => ({type: 'reset', data: {origin: 'new-entities'}}))
      .multicast().tap(x => console.log('reset on new entities'))
  ]).multicast()

  function areEntitiesIdentical (previous, current) {
    // console.log('areEntitiesIdentical', previous, current)
    if (current.length !== previous.length) {
      return false
    }
    for (let i = 0; i < current.length; i++) {
      if (current[i].geometry.positions.length !== previous[i].geometry.positions.length) {
        return false
      }
    }

    return true
  }
// zoomToFit main mesh bounds
  const zoomToFit$ = most.mergeArray([
    gestures.taps.filter(taps => taps.nb === 3)
      .map(_ => ({type: 'zoomToFit', data: {origin: 'demand'}})),
    state$
      .filter(state => state.behaviours.zoomToFitOn.includes('new-entities'))
      .map(state => state.entities).skipRepeatsWith(areEntitiesIdentical)
      .map(_ => ({type: 'zoomToFit', data: {origin: 'new-entities'}}))
      .multicast().tap(x => console.log('zoomToFit on new entities'))
  ])
  .multicast()

  const head = (array) => {
    if (array === undefined || null) {
      return undefined
    }
    if (array.length === 0) {
      return undefined
    }
    return array[0]
  }

  let toPresetView$ = most.sample(function (event, state) {
    const ctrl = event.ctrlKey ? 'ctrl+' : ''
    const shift = event.shiftKey ? 'shift+' : ''
    const meta = event.metaKey ? 'command+' : ''
    let key = event.key.toLowerCase()
    if (ctrl && key === 'control') {
      key = ''
    }
    if (shift && key === 'shift') {
      key = ''
    }
    if (meta && key === 'meta') {
      key = ''
    }
    const compositeKey = `${ctrl}${shift}${meta}${key}`
    // console.log('compositeKey', compositeKey, state.shortcuts[compositeKey])
    const viewPresets = ['top', 'bottom', 'front', 'back', 'left', 'right']
    const shortCutToViewName = viewPresets.reduce(function (acc, name, index) {
      const shortCutName = `to${name[0].toUpperCase()}${name.slice(1)}View`
      acc[shortCutName] = name
      return acc
    }, {})
    const keyAndCommand = head(state.shortcuts.filter(shortcut => shortcut.key === compositeKey))
    const validShortCut = !keyAndCommand ? false : Object.keys(shortCutToViewName).includes(keyAndCommand.command)
    const viewName = !keyAndCommand ? undefined : shortCutToViewName[keyAndCommand.command]
    return {validShortCut, viewName}
  }, keyDowns$, keyDowns$, state$)
    .filter(x => x.validShortCut === true)
    .map(data => ({type: 'toPresetView', data: data.viewName}))

  let toPerspectiveView$ = keyDowns$
    .filter(event => event.key === 'p')

  let toOrthoView$ = keyDowns$
    .filter(event => event.key === 'o')

  const update$ = rafStream().thru(limitFlow(33))
    .map(_ => ({type: 'update', data: undefined}))

  return [
    rotations$,
    pan$,
    zoom$,
    reset$,
    zoomToFit$,
    resizes$,
    update$,

    toPresetView$,
    toPerspectiveView$.map(data => ({type: 'toPerspectiveView', data})),
    toOrthoView$.map(data => ({type: 'toOrthoView', data}))
  ]
}

module.exports = actions
