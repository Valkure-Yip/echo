/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
function genRandomValue(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoose(s, k) {
  // returns a random k element subset of s
  var a = [],
    i = -1,
    j;
  while (++i < k) {
    j = Math.floor(Math.random() * s.length);
    a.push(s.splice(j, 1)[0]);
  }
  return a;
}

function unorderedPairs(s) {
  // returns the list of all unordered pairs from s
  var i = -1,
    a = [],
    j;
  while (++i < s.length) {
    j = i;
    while (++j < s.length) a.push([s[i], s[j]]);
  }
  return a;
}

function roundToTwo(num) {
  return +(Math.round(num + "e+2") + "e-2");
}
