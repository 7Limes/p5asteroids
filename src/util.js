function rotatePointAroundPoint(point, center, angle) {
  let [px, py] = point;
  let [cx, cy] = center;
  let s = Math.sin(angle);
  let c = Math.cos(angle);
  px -= cx;
  py -= cy;
  let newx = px*c - py*s;
  let newy = px*s + py*c;
  return [cx+newx, cy+newy];
}

// degrees
function drawRotatedShape(shape, center, angle, scale) {
  beginShape();
  for (let point of shape) {
    let newPoint = [point[0]*scale+center[0], point[1]*scale+center[1]]
    let [vx, vy] = rotatePointAroundPoint(newPoint, center, radians(angle));
    vertex(vx, vy);
  }
  endShape(CLOSE);
}

function wrap(x, lower, upper) {
  if (x < lower)
    return x+upper;
  if (x > upper)
    return x-upper;
  return x;
}

function clamp(x, lower, upper) {
  if (x < lower)
    return lower;
  if (x > upper)
    return upper
  return x;
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
}

function randDecimal(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}