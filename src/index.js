const {union} = require('@jscad/scad-api').booleanOps
const {pointerGestures} = require('most-gestures')
const {holdSubject} = require('./observable-utils/most-subject/index')
// require('most-subject')github:briancavalier/most-subject : issues with webpack hence the above

const prepareRender = require('./rendering/render')
const prepareCameraAndControls = require('./cameraAndControls')
const csgToGeometries = require('./geometry-utils/csgToGeometries')
const computeBounds = require('./bound-utils/computeBounds')
const areCSGsIdentical = require('./csg-utils/areCSGsIdentical')

function flatten (array) {
  return [].concat(...array)
}
function toArray (data) {
  if (data === undefined || data === null) { return [] }
  if (data.constructor !== Array) { return [data] }
  return data
}

const makeCsgViewer = function (container, options = {}) {
  const defaults = {
    singleton: true,
    csgCheck: false,
    camera: {
      position: [150, 250, 200],
      far: 18000
    },
    controls: {
      limits: {
        maxDistance: 16000,
        minDistance: 0.01
      },
      zoomToFit: {
        targets: 'all'
      }
    },
    background: [1, 1, 1, 1],
    meshColor: [1, 0.5, 0.5, 1],
    grid: {
      show: false,
      color: [1, 1, 1, 1]
    },
    axes: {
      show: true
    },
    lighting: {
      smooth: false
    }
  }

  let gestures
  let resizes$
  let initialized = false
  let regl
  let cameraAndControls

  let cachedCsg
  // hack for now: the inner representation of the CSG's geometry + meta (bounds etc)
  let geometry
  let bounds
  let entity
  // we keep the render function around, until we need to swap it out in case of new data
  let render

  let baseParams = Object.assign({}, defaults, options)
  // we use an observable of parameters to play nicely with the other observables
  // note: subjects are anti patterns, but they simplify things here so ok for now
  const params$ = holdSubject()

  if (!baseParams.singleton || (baseParams.singleton && !initialized)) {
    // initialize when container changes
    regl = require('regl')(container)
    // setup interactions, change when container changes
    gestures = pointerGestures(container)
    resizes$ = require('./elementSizing')(container)
    cameraAndControls = prepareCameraAndControls(gestures, resizes$, container, baseParams, params$)
  }
  if (baseParams.singleton) {
    initialized = true
  }

  return function (options = {}, data) {
    let params = Object.assign({}, baseParams, options)

    // setup data
    // warning !!! fixTJunctions alters the csg and can result in visual issues ??
    if (data && data.csg) {
      const csg = union(toArray(data.csg)) // FXIME : ACTUALLY deal with arrays as inputs
      // .fixTJunctions()
      if (!params.csgCheck || !areCSGsIdentical(csg, cachedCsg)) {
        cachedCsg = csg
        const start = performance.now()
        const geometries = csgToGeometries(csg, {smoothLighting: params.lighting.smooth})//, normalThreshold: 0})
        geometry = flatten(geometries)// FXIME : ACTUALLY deal with arrays as inputs
        geometry = geometry[0]
        const time = (performance.now() - start) / 1000
        console.log(`Total time for geometry conversion: ${time} s`)
        // console.log('geometry', geometry)
        bounds = computeBounds({geometry: geometry})// FXIME : ACTUALLY deal with arrays as inputs
      }
      // reuse
      entity = {geometry, bounds}
      // create a render function, with updated data
      render = prepareRender(regl, Object.assign({}, params, {geometry, bounds}))
    }

    cameraAndControls(render)
    // FIXME: hack for now, normally there would be an array of entities
    params.entity = entity
    params$.next(params)

    return regl
  }
}

module.exports = makeCsgViewer
