const {pointerGestures} = require('most-gestures')
const most = require('most')
const {proxy} = require('most-proxy')
const {holdSubject} = require('./observable-utils/most-subject/index')
// require('most-subject')github:briancavalier/most-subject : issues with webpack hence the above
const makeCameraControlsActions = require('./cameraControlsActions')
const makeDataParamsActions = require('./dataParamsActions')
const makeState = require('./state')
const {merge} = require('./utils')
const prepareRender = require('./rendering/render')

const makeCsgViewer = function (container, options = {}, inputs$ = most.never()) {
  const defaults = {
    glOptions: {// all lower level webgl options passed directly through regl
      alpha: false
    },
    // after this , initial params of camera, controls & render
    camera: require('./cameraAndControls/perspectiveCamera').defaults,
    controls: require('./cameraAndControls/orbitControls').defaults,
    overrideOriginalColors: false, // for csg/cag conversion: do not use the original (csg) color, use meshColor instead
    lighting: {
      smooth: false
    },
    grid: {
      show: false,
      color: [1, 1, 1, 1],
      fadeOut: true
    },
    axes: {
      show: true
    },
    rendering: {
      background: [1, 1, 1, 1],
      meshColor: [1, 0.5, 0.5, 1], // use as default face color for csgs, color for cags
      lightDirection: [0.2, 0.2, 1],
      lightPosition: [100, 200, 100],
      ambientLightAmount: 0.3,
      diffuseLightAmount: 0.89,
      specularLightAmount: 0.16,
      materialShininess: 8.0
    },
    shortcuts: [
      {key: 'f', command: 'toFrontView'},
      {key: 'b', command: 'toBackView'},
      {key: 't', command: 'toTopView'},

      {key: 'b', command: 'toBottomView'},
      {key: 'l', command: 'toLeftView'},
      {key: 'r', command: 'toRightView'},

      {key: 'p', command: 'toPerspectiveView'},
      {key: 'o', command: 'toOrthoView'}
    ],
    //
    behaviours: {
      resetViewOn: ['new-entities'],
      zoomToFitOn: ['new-entities'],
      useGestures: true // toggle if you want to use external inputs to control camera etc
    },
    //
    entities: [], // inner representation of the CSG's geometry + meta (bounds etc)
    csgCheck: false // not used currently
  }
  let state = merge({}, defaults, options)

  // we use an observable of parameters to play nicely with the other observables
  // note: subjects are anti patterns, but they simplify things here so ok for now
  const params$ = holdSubject()
  const data$ = holdSubject()
  const errors$ = holdSubject()
  const { attach, stream } = proxy()
  const state$ = stream

  // initialize when container changes
  const regl = require('regl')({
    container,
    attributes: state.glOptions,
    onDone: function (err, callback) {
      if (err) {
        errors$.next(err)
      }
      // console.error('foo', err)
      // console.log('all ok', callback)
    }
  })

  // note we keep the render function around, until we need to swap it out in case of new data
  state.render = prepareRender(regl, state)

  const sources$ = {
    inputs$: inputs$.filter(x => x !== undefined), // custom user inputs
    gestures: pointerGestures(container),
    resizes$: require('./cameraAndControls/elementSizing')(container),
    params$: params$.filter(x => x !== undefined), // we filter out pointless data from the get go
    data$: data$.filter(x => x !== undefined), // we filter out pointless data from the get go
    state$ // thanks to proxying, we also have access to the state observable/stream inside our actions
  }
  const cameraControlsActions = makeCameraControlsActions(sources$)
  const dataParamsActions = makeDataParamsActions(sources$)
  const actions = most.mergeArray(dataParamsActions.concat(cameraControlsActions))
  attach(makeState(actions, state, regl)) // loop back state

  // re-render whenever state changes, since visuals are a function of the state
  state$.forEach(state => state.render(state))

  /** main viewer function : call this one with different parameters and/or data to update the viewer
   * @param  {Object} options={}
   * @param  {Object} data
   */
  const csgViewer = function (params = {}, data) {
    // dispatch data & params
    data$.next(data)
    params$.next(params)
  }
  return {csgViewer, viewerDefaults: defaults, viewerState$: state$}
}

module.exports = makeCsgViewer
