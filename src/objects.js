function wrapObject(x, y, size) {
  let [newx, newy] = [x, y];
  if (x > windowWidth+size)
    newx = -size
  else if (x < -size)
    newx = windowWidth+size;
  if (y > windowHeight+size)
    newy = -size;
  else if (y < -size)
    newy = windowHeight+size;
  return [newx, newy];
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocity = createVector(0, 0);
    
    this.angle = 0;
    this.boosting = false;
    this.bullets = [];
    this.shootCooldown = 0;

    this.particleEffects = [];

    this.score = 0;
  }

  getVector(strength) {
    return p5.Vector.fromAngle(radians(this.angle), strength);
  }
  
  tick(asts) {
    if (keyIsDown(37))
      this.angle -= PLAYER_TURN_SPEED
    if (keyIsDown(39))
      this.angle += PLAYER_TURN_SPEED
    
    this.boosting = keyIsDown(38);
    if (this.boosting) {
      let vec = this.getVector(PLAYER_ACCEL);
      this.velocity.x = clamp(this.velocity.x+vec.x, -PLAYER_MAX_VELOCITY, PLAYER_MAX_VELOCITY);
      this.velocity.y = clamp(this.velocity.y+vec.y, -PLAYER_MAX_VELOCITY, PLAYER_MAX_VELOCITY);
    }
    
    this.shootCooldown -= 1;
    if (keyIsDown(32) && this.shootCooldown < 0) {
      if (this.bullets.length > MAX_BULLETS)
        this.bullets.shift();
      let fireVec = this.getVector(PLAYER_SCALE);
      let fireX = this.x+fireVec.x;
      let fireY = this.y+fireVec.y;

      let bulletVelocity = this.getVector(BULLET_SPEED);
      bulletVelocity.add(this.velocity);
      let b = new Bullet(fireX, fireY, bulletVelocity);
      this.bullets.push(b);
      this.shootCooldown = BULLET_FIRE_DELAY;
    }
    
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    [this.x, this.y] = wrapObject(this.x, this.y, PLAYER_SCALE*5);

    // move bullets, break asteroids
    for (let i = 0; i < this.bullets.length; i++) {
      let b = this.bullets[i];
      b.tick();
      for (let ast of asts) {
        if (ast.hits(b.x, b.y)) {
          let effect = new ParticleEffect(ast.x, ast.y, 20);
          this.particleEffects.push(effect);
          breakAsteroid([b.x, b.y], ast, asts);
          this.bullets.splice(i, 1);
          this.score += 100;
        }
      }
    }

    //  check player hit asteroid
    for (let ast of asts) {
      if (ast.hitsCircle(this.x, this.y, PLAYER_SCALE*5)) {
        this.x = windowWidth/2;
        this.y = windowHeight/2;
        this.velocity.mult(0);
        this.angle = 0;
        this.score = 0;
      }
    }

    // particles
    for (let i = 0; i < this.particleEffects.length; i++) {
      let effect = this.particleEffects[i];
      if (effect.tickdraw()) {
        this.particleEffects.splice(i, 1);
        i -= 1;
      }
    }
  }

  draw() {
    let shape = !this.boosting ? PLAYER_POINTS : PLAYER_BOOSTING_POINTS;
    drawRotatedShape(shape, [this.x, this.y], this.angle, PLAYER_SCALE);
    for (let b of this.bullets) {
      b.draw();
    }
  }
}

class Asteroid {
  constructor(x, y, vec, type, scale) {
    this.x = x;
    this.y = y;
    this.vec = vec;
    this.type = type;
    this.scale = scale;
    
    this.angle = 0;
    this.rotateSpeed = randDecimal(-2, 2);
  }

  getRadius() {
    return ASTEROID_SIZES[this.scale]*5;
  }

  hits(x, y) {
    return distance(this.x, this.y, x, y) < this.getRadius();
  }

  hitsCircle(x, y, rad) {
    let dist = distance(this.x, this.y, x, y);
    return (dist <= this.getRadius()+rad);
  }

  tick() {
    this.x += this.vec.x;
    this.y += this.vec.y;
    [this.x, this.y] = wrapObject(this.x, this.y, this.getRadius());
    this.angle += this.rotateSpeed;
  }

  draw() {
    let shape = ASTEROID_POINTS[this.type];
    drawRotatedShape(shape, [this.x, this.y], this.angle, ASTEROID_SIZES[this.scale]);
  }
}

class Bullet {
  constructor(x, y, vec) {
    this.x = x;
    this.y = y;
    this.vec = vec;
  }

  tick() {
    this.x += this.vec.x;
    this.y += this.vec.y;
    [this.x, this.y] = wrapObject(this.x, this.y, 0);
  }

  draw() {
    ellipse(this.x, this.y, 3, 3);
  }
}

class Particle {
  constructor(x, y, vec, duration) {
    this.x = x;
    this.y = y;
    this.vec = vec;
    this.duration = duration
  }

  tickdraw() {
    this.duration -= 1;
    if (this.duration <= 0)
      return true;
    this.x += this.vec.x;
    this.y += this.vec.y;

    rect(this.x, this.y, 1, 1);
    return false;
  }
}

class ParticleEffect {
  constructor(x, y, amount) {
    this.x = x;
    this.y = y;
    this.particles = [];
    for (let i = 0; i < amount; i++) {
      let p = new Particle(
        this.x, this.y,
        createVector(randDecimal(-0.5, 0.5), randDecimal(-0.5, 0.5)),
        randInt(20, 45)
      );
      this.particles.push(p);
    }
  }

  tickdraw() {
    for (let i = 0; i < this.particles.length; i++) {
      let p = this.particles[i];
      if (p.tickdraw()) {
        this.particles.splice(i, 1);
        i -= 1;
      }
    }
    return this.particles.length == 0
  }
}

// asteroid splits into smaller asteroids with vectors perpendicular to contact point
function breakAsteroid(contactPoint, ast, asts) {
  if (ast.scale > 0) {
    let [cx, cy] = contactPoint;
    let v1 = createVector(ast.x-cx, ast.y-cy);
    v1.normalize();
    v1.rotate(-HALF_PI);
    let v2 = v1.copy();
    v1.mult(randDecimal(0, 2));
    v2.mult(randDecimal(-2, 0))
    let a1 = new Asteroid(
      ast.x, ast.y, v1,
      randInt(0, 3), ast.scale-1
    );
    let a2 = new Asteroid(
      ast.x, ast.y, v2,
      randInt(0, 3), ast.scale-1
    );
   asts.push(a1, a2);
  }
  asts.splice(asts.indexOf(ast), 1);
}