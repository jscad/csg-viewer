const {union} = require('@jscad/scad-api').booleanOps
const {pointerGestures} = require('most-gestures')
const {holdSubject} = require('./observable-utils/most-subject/index')
// require('most-subject')github:briancavalier/most-subject : issues with webpack hence the above

const prepareRender = require('./rendering/render')
const prepareCameraAndControls = require('./cameraAndControls/cameraAndControls')
const computeBounds = require('./bound-utils/computeBounds')
const areCSGsIdentical = require('./csg-utils/areCSGsIdentical')

const csgToGeometries = require('./geometry-utils/csgToGeometries')
const cagToGeometries = require('./geometry-utils/cagToGeometries')

const {flatten, toArray} = require('./utils')

const makeCameraActions = require('./cameraAndControls/actions')

function deeperAssign (currentState, options) {
  /* console.log('objects', objects)
  object.keys(objects[1]).forEach((key)=>{
    objects[0][key] = Object.assign({}, objects[1][key])
  } */
  let rootKeys = ['camera', 'controls', 'background', 'meshColor', 'grid', 'axes', 'lighting']
  let output = {}
  rootKeys.forEach(function (key) {
    output[key] = Object.assign({}, currentState[key], options[key])
  })
  return output
  // for(object.key())
}

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
    }
  }

  let gestures
  let resizes$
  let regl
  let cameraAndControls

  let cachedCsg
  // hack for now: the inner representation of the CSG's geometry + meta (bounds etc)
  let geometry
  let bounds
  let entity
  // we keep the render function around, until we need to swap it out in case of new data
  let render

  let baseParams = deeperAssign(defaults, options)
  let state = baseParams

  // we use an observable of parameters to play nicely with the other observables
  // note: subjects are anti patterns, but they simplify things here so ok for now
  const params$ = holdSubject()

  console.log('baseParams/originalState', baseParams)//, options)
  // initialize when container changes
  regl = require('regl')(container)
  // setup interactions, change when container changes
  gestures = pointerGestures(container)
  resizes$ = require('./cameraAndControls/elementSizing')(container)

  const cameraActions = makeCameraActions({gestures, resizes$, params$})
  cameraAndControls = prepareCameraAndControls(cameraActions, baseParams)
  cameraAndControls.map(({camera, controls}) => {
    return Object.assign({}, state, {camera, controls})
  })
  .forEach(function (state) {
    console.log('updated state', state)
    render(state)
  })

  /*
  // some params become state and NEED to be passed to the render function
    background
    meshColor
    grid: {
      show,
      color
    },
     axes: {
      show
    }
    lighting

  // some should be kept to the initial defaults
  params.csgCheck
  smoothLighting

  // some others are 'one time use' and should be reset to default if the main function is called
  without setting them explictely ?
  */

  /** main viewer function : call this one with different parameters and/or data to update the viewer
   * @param  {Object} options={}
   * @param  {Object} data
   */
  return function csgViewer (options = {}, data) {
    const params = options
    state = deeperAssign(state, options)
    // setup data
    // warning !!! fixTJunctions alters the csg and can result in visual issues ??
    if (data && data.csg) {
      const csg = union(toArray(data.csg)) // FXIME : ACTUALLY deal with arrays as inputs
      // .fixTJunctions()
      if (!params.csgCheck || !areCSGsIdentical(csg, cachedCsg)) {
        cachedCsg = csg
        const start = performance.now()
        let geometries
        if ('sides' in csg) {
          geometries = cagToGeometries(csg, {})
        } else {
          geometries = csgToGeometries(csg, {smoothLighting: baseParams.lighting.smooth})//, normalThreshold: 0})
        }

        geometry = flatten(geometries)// FXIME : ACTUALLY deal with arrays as inputs
        geometry = geometry[0]
        const time = (performance.now() - start) / 1000
        // console.log(`Total time for geometry conversion: ${time} s`)
        // console.log('geometry', geometry)
        bounds = computeBounds({geometry: geometry})// FXIME : ACTUALLY deal with arrays as inputs
      }
      // reuse
      entity = {geometry, bounds}
      // create a render function, with updated data
      render = prepareRender(regl, Object.assign({}, params, {geometry, bounds}))
    }

    // cameraAndControls(render)
    // FIXME: hack for now, normally there would be an array of entities
    params.entity = entity
    console.log('in index', params)
    params$.next(params)

    return regl
  }
}

module.exports = makeCsgViewer
