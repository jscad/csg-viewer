function flatten (array) {
  return [].concat(...array)
}
function toArray (data) {
  if (data === undefined || data === null) { return [] }
  if (data.constructor !== Array) { return [data] }
  return data
}

function deeperAssign (currentState, options) {
  /* console.log('objects', objects)
  object.keys(objects[1]).forEach((key)=>{
    objects[0][key] = Object.assign({}, objects[1][key])
  } */
  let rootKeys = ['overrideOriginalColors', 'camera', 'controls', 'background', 'meshColor', 'grid', 'axes', 'lighting', 'entities', 'render']
  let output = {}
  rootKeys.forEach(function (key) {
    if (key === 'render' || key === 'overrideOriginalColors') {
      output[key] = options[key] !== undefined ? options[key] : currentState[key]
    } else {
      const current = currentState ? currentState[key] : {}
      const updated = options[key]
      let initial = (Array.isArray(updated) || Array.isArray(current)) ? [] : {}
      output[key] = Object.assign(initial, current, updated)
    }
  })
  return output
  // for(object.key())
}

module.exports = {
  flatten,
  toArray,
  deeperAssign
}
