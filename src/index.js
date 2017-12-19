const {pointerGestures} = require('most-gestures')
const {holdSubject} = require('./observable-utils/most-subject/index')
// require('most-subject')github:briancavalier/most-subject : issues with webpack hence the above
const makeCameraActions = require('./cameraAndControls/actions')
const makeActions = require('./actions')
const makeState = require('./state')
const {deeperAssign} = require('./utils')
const most = require('most')
const prepareRender = require('./rendering/render')

const makeCsgViewer = function (container, options = {}) {
  const defaults = {
    csgCheck: false,
    // after this , initial params of camera, controls & render
    camera: require('./cameraAndControls/perspectiveCamera').defaults,
    controls: require('./cameraAndControls/orbitControls').defaults,
    //
    background: [1, 1, 1, 1],
    meshColor: [1, 0.5, 0.5, 1],
    grid: {
      show: false,
      color: [1, 1, 1, 1]
    },
    axes: {
      show: true
    },
    //
    lighting: {
      smooth: false
    },
    //
    entities: [] // inner representation of the CSG's geometry + meta (bounds etc)
  }

  // we use an observable of parameters to play nicely with the other observables
  // note: subjects are anti patterns, but they simplify things here so ok for now
  const params$ = holdSubject()
  const data$ = holdSubject()

  // initialize when container changes
  const regl = require('regl')(container)
  // setup interactions, change when container changes
  const gestures = pointerGestures(container)
  const resizes$ = require('./cameraAndControls/elementSizing')(container)

  let state = deeperAssign(defaults, options)
  // note we keep the render function around, until we need to swap it out in case of new data
  state.render = prepareRender(regl, state)

  const sources$ = {gestures, resizes$, params$, data$}
  const cameraActions = makeCameraActions(sources$)
  const dataActions = makeActions(sources$)
  const actions = most.mergeArray(dataActions.concat(cameraActions))
  const dataState$ = makeState(actions, state, regl)

  // re-render whenever state changes, since visuals are a function of the state
  dataState$.forEach(state => state.render(state))

  /** main viewer function : call this one with different parameters and/or data to update the viewer
   * @param  {Object} options={}
   * @param  {Object} data
   */
  return function csgViewer (params = {}, data) {
    // dispatch data & params
    data$.next(data)
    params$.next(params)
    return regl
  }
}

module.exports = makeCsgViewer
