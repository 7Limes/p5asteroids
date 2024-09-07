var p;
var asteroids = [];
var nextLevelCount = 0;

function createAsteroids() {
  let asts = []
  for (let i = 0; i < randInt(5, 10); i++) {
    let ax, ay;
    do {
    ax = randInt(0, windowWidth);
    ay = randInt(0, windowHeight);
    } while(distance(ax, ay, p.x, p.y) < 150)
    let a = new Asteroid(
      ax, ay,
      createVector(randDecimal(-2, 2), randDecimal(-2, 2)),
      randInt(0, 3), randInt(0, 2)
    )
    asts.push(a);
  }
  return asts;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  stroke(255);
  noFill();
  frameRate(60);
  textAlign(CENTER);
  
  p = new Player(windowWidth/2, windowHeight/2);
  asteroids = createAsteroids();
}

function draw() {
  if (nextLevelCount == 0 && asteroids.length == 0)
    nextLevelCount = 120;
  if (nextLevelCount > 0) {
    nextLevelCount -= 1;
    if (nextLevelCount == 0)
      asteroids = createAsteroids();
  }
  background(0);
  p.tick(asteroids);
  for (let a of asteroids) {
    a.tick();
    a.draw();
  }
  p.draw();
  text(p.score, windowWidth/2, 30);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
