const {flatten, toArray} = require('./utils')
const csgToGeometries = require('./geometry-utils/csgToGeometries')
const cagToGeometries = require('./geometry-utils/cagToGeometries')
const computeBounds = require('./bound-utils/computeBounds')
const areCSGsIdentical = require('./csg-utils/areCSGsIdentical')

function entitiesFromSolids (baseParams, solids) {
  solids = toArray(solids)
  // warning !!! fixTJunctions alters the csg and can result in visual issues ??
  // .fixTJunctions()
  // if (!params.csgCheck) { // || !areCSGsIdentical(csg, cachedSolids)) {
  // cachedSolids = solids
  // const start = performance.now()
  const entities = solids.map(function (solid) {
    let geometry
    let type
    if ('sides' in solid) {
      type = '2d'
      geometry = cagToGeometries(solid, {color: baseParams.meshColor})
    } else {
      type = '3d'
      geometry = csgToGeometries(solid, {smoothLighting: baseParams.lighting.smooth, faceColor: baseParams.meshColor})//, normalThreshold: 0})
    }
    // geometry = flatten(geometries)// FXIME : ACTUALLY deal with arrays since a single csg can
    // generate multiple geometries if positions count is >65535
    geometry = flatten(geometry)[0]
    // const time = (performance.now() - start) / 1000
    // console.log(`Total time for geometry conversion: ${time} s`)
    // console.log('geometry', geometry)
    const bounds = computeBounds({geometry})// FXIME : ACTUALLY deal with arrays as inputs
    // reuse
    const entity = {geometry, bounds, type}
    return entity
  })
  // }
  return entities
}

module.exports = entitiesFromSolids
