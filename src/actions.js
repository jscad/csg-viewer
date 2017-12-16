const decrement$ = sources.DOM
.select('.decrement').events('click').mapTo(-1)

const increment$ = sources.DOM
.select('.increment').events('click').mapTo(+1)

function actions (sources) {
  const {gestures, resizes} = sources


  
}
