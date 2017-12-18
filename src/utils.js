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
  let rootKeys = ['camera', 'controls', 'background', 'meshColor', 'grid', 'axes', 'lighting', 'entities']
  let output = {}
  rootKeys.forEach(function (key) {
    const current = currentState ? currentState[key] : {}
    const updated = options[key]
    let initial = Array.isArray(updated) ? [] : {}
    output[key] = Object.assign(initial, current, updated)
  })
  return output
  // for(object.key())
}

module.exports = {
  flatten,
  toArray,
  deeperAssign
}
