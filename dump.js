var NanoTimer = require('nanotimer');

function main() {
  var timer = new NanoTimer();

  timer.setInterval(countDown, '', '1s');
}

function countDown() {
  console.log('One Sec');
}
main();
