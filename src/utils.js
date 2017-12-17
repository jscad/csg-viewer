function flatten (array) {
  return [].concat(...array)
}
function toArray (data) {
  if (data === undefined || data === null) { return [] }
  if (data.constructor !== Array) { return [data] }
  return data
}
module.exports = {
  flatten,
  toArray
}
