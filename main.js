const FPS = 30;
const friction = 0.8; // friction coefficient of space (0 = no friction, 1 = lots of friction)
const gameLives = 3; // starting number of lives
const laserDist = 0.6; // max distance laser can travel as fraction of screen width
const laserExplodeDur = 0.1; // duration of the laser's explosion in seconds
const laserMax = 10; // max number of lasers on the screen at once
const laserSpeed = 500; // speed of lasers in pixels per second
const asteroidJag = 0.4; // jaggedness of the asteroids (0 = none, 1 = lots)
const asteroidPtsLrg = 20; // points scored for a larger asteroid
const asteroidPtsMed = 50; // points scored for a medium asteroid
const asteroidPtsSml = 100; // points scored for a smaller asteroid
const asteroidNum = 1; // starting number of asteroids
const asteroidSize = 100; // in pixels
const asteroidSpeed = 50; // max speed in pixels per second
const asteroidVert = 10; // avg number of verticies on each asteroid
const shipSize =  30; // in pixels
const shipBlinkDur = 0.1; // duration of the ship's blink during invisibility in seconds
const saveKeyScore = 'highscore'; // save key for the local storage of high score
const shipExplodeDur = 0.3; // duration in seconds
const shipInvisibilityDur = 3; // duration of ships invisibility in seconds
const shipThrust = 5; // acceleration of ship in pixels per second per second
const turnSpeed = 360; // in degrees per second
const showBounding = false; // show or hide collision bounding
const showCenterDot = false;
const soundOn = false;
const musicOn = false;
const textFadeTime = 2.5 // text fade time in seconds
const textSize = 35; // text font height in pixels

var canv = document.getElementById('game-canvas');
var ctx = canv.getContext('2d');

// set up sound effects
var fxLaser = new Sound('sounds/laser.m4a', 5, 0.6);
var fxHit = new Sound('sounds/hit.m4a', 5, 0.7);
var fxExplode = new Sound('sounds/explode.m4a', 3, 0.8);
var fxThrust = new Sound('sounds/thrust.m4a', 2, 0.3);

// set up the music
var music = new Music('sounds/music-low.m4a', 'sounds/music-high.m4a');
var asteroidsLeft, asteroidsTotal;

// set up the game parameters
var level, lives, asteroids, score, scoreHigh, ship, text, textAlpha;
newGame();


// set up event handlers
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
    asteroidsTotal = (asteroidNum + level) * 7;
    asteroidsLeft = asteroidsTotal;
    asteroids = [];
    var x, y;
    for (var i = 0; i < asteroidNum + level; i++) {
        do {
            x = Math.floor(Math.random() * canv.width);
            y = Math.floor(Math.random() * canv.height); 
                } while (distBetweeenPoints(ship.x, ship.y, x, y) < asteroidSize * 2 + ship.r);
                    asteroids.push(newAsteroid(x, y, Math.ceil(asteroidSize / 2)));
    }
}

function destroyAsteroid(index) {
    var x = asteroids[index].x;
    var y = asteroids[index].y;
    var r = asteroids[index].r;

    // split the asteroid in two if necessary
    if (r == Math.ceil(asteroidSize / 2)) {
        asteroids.push(newAsteroid(x, y, Math.ceil(asteroidSize / 4)));
        asteroids.push(newAsteroid(x, y, Math.ceil(asteroidSize / 4)));
        score += asteroidPtsLrg;
    } else if (r == Math.ceil(asteroidSize / 4)) {
        asteroids.push(newAsteroid(x, y, Math.ceil(asteroidSize / 8)));
        asteroids.push(newAsteroid(x, y, Math.ceil(asteroidSize / 8)));
        score += asteroidPtsMed;
    } else {
        score += asteroidPtsSml;
    }

    // check high score
    if(score > scoreHigh) {
        scoreHigh = score;
        localStorage.setItem(saveKeyScore, scoreHigh);
    }

    // destroy the asteroid
    asteroids.splice(index, 1);
    fxHit.play();

    // calculate the ratio of remaining asteroids to determine the music tempo
    asteroidsLeft--;
    music.setAsteroidRatio(asteroidsLeft == 0 ? 1 : asteroidsLeft / asteroidsTotal);

    // new level when no more asteroids 
    if (asteroids.length == 0) {
        level++;
        newLevel();
    }
}

function distBetweeenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, color = 'white') {
    ctx.strokeStyle = color;
            ctx.lineWidth = shipSize / 20;
            ctx.beginPath();
            ctx.moveTo( // nose of ship
                x + 4 / 3 * ship.r * Math.cos(a),
                y - 4 / 3 * ship.r * Math.sin(a)
                );
            ctx.lineTo( // rear left
                 x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
                 y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a))
                 );
            ctx.lineTo( // rear right
                x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
                y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
                );
            ctx.closePath();
            ctx.stroke();
}

function explodeShip() {
   ship.explodeTime = Math.ceil(shipExplodeDur * FPS);
   fxExplode.play();
}

function gameOver() {
    ship.dead = true;
    text = 'game over';
    textAlpha = 1.0; 
}

function keyDown(e) {

    if (ship.dead) {
        return;
    }

    switch(e.keyCode) {
        case 32: // space bar (shoot laser)
            shootLaser();
            break;
        case 37: // left arrow (rotate left)
            ship.rotation = turnSpeed / 180 * Math.PI / FPS;
            break;
        case 38:  // up arrow (thrust upward)
            ship.thrusting = true;
            break;
        case 39: // right arrow (rotate right)
            ship.rotation = -turnSpeed / 180 * Math.PI / FPS;
            break;
}
}

function keyUp(e) {

    if (ship.dead) {
        return;
    }

    switch(e.keyCode) {
        case 32: // space bar (allow shooting again)
            ship.canShoot = true;
            break;
        case 37: // left arrow (stop rotating left)
            ship.rotation = 0;
            break;
        case 38:  // up arrow (stop thrusting upward)
            ship.thrusting = false;
            break;
        case 39: // right arrow (stop rotating right)
            ship.rotation = 0;
            break;
}
}

function newAsteroid(x, y, r) {
    var lvlMult = 1 + 0.1 * level;
    var asteroid = {
        x: x,
        y: y,
        xv: Math.random() * asteroidSpeed * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * asteroidSpeed * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: r,
        a: Math.random() * Math.PI * 2, // in radians
        vert: Math.floor(Math.random() * (asteroidVert + 1) + asteroidVert / 2),
        offs: []
        };

    // create the vertex offsets array
    for (var i = 0; i < asteroid.vert; i++) {
        asteroid.offs.push(Math.random() * asteroidJag * 2 + 1 - asteroidJag);
    }
    return asteroid;
}

function newGame() {
    level = 0;
    lives = gameLives;
    score = 0;
    ship = newShip();

// get the high score from local storage
var scoreStr = localStorage.getItem(saveKeyScore);
if (scoreStr == null) {
    scoreHigh = 0;
} else {
    scoreHigh = parseInt(scoreStr);
}

    newLevel();
}

function newLevel() {
    text = 'level ' + (level + 1);
    textAlpha = 1.0; 
    createAsteroidBelt();
}

function newShip() {
    return {

        x: canv.width / 2,
        y: canv.height / 2,
        r: shipSize / 2,
        a: 90 / 180 * Math.PI, // convert to radians
        blinkNum: Math.ceil(shipInvisibilityDur / shipBlinkDur),
        blinkTime: Math.ceil(shipBlinkDur * FPS),
        canShoot: true,
        dead: false,
        explodeTime: 0, 
        lasers: [],
        rotation: 0,
        thrusting: false,
        thrust: { // magnitude
            x: 0,
            y: 0
        }
    }
}

function shootLaser() {
    // create the laser object
    if (ship.canShoot && ship.lasers.length < laserMax) {
        ship.lasers.push({ // from the nose oerf the ship
            x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
            xv: laserSpeed * Math.cos(ship.a) / FPS,
            yv: -laserSpeed * Math.sin(ship.a) / FPS,
            dist: 0,
            explodeTime: 0
        });
        fxLaser.play();
    }

    // prevent further shooting
    ship.canShoot = false;
}

function Music(srcLow, srcHigh) {
    this.soundLow = new Audio(srcLow);
    this.soundHigh = new Audio(srcHigh);
    this.low = true;
    this.tempo = 1.0; // seconds per beat
    this.beatTime = 0; // frames left until next beat

    this.play = function() {
        if (musicOn) {
        if (this.low) {
            this.soundLow.play();
        } else {
            this.soundHigh.play();
        }
        this.low = !this.low;
    }
}

    this.setAsteroidRatio = function(ratio) {
        this.tempo = 1.0 - 0.75 * (1.0 - ratio);
    }

    this.tick = function() {
        if (this.beatTime == 0) {
            this.play();
            this.beatTime = Math.ceil(this.tempo * FPS);
        } else {
            this.beatTime--;
        }
    }
}

function Sound(src, maxStreams = 1, vol = 1.0) {
    this.streamNum = 0;
    this.streams = [];
    for (var i = 0; i < maxStreams; i++) {
        this.streams.push(new Audio(src));
        this.streams[i].volume = vol;
    } 

    this.play = function() {
        if (soundOn) {
        this.streamNum = (this.streamNum + 1) % maxStreams;
        this.streams[this.streamNum].play();
        }
    }

    this.stop = function() {
        this.streams[this.streamNum].pause();
        this.streams[this.streamNum].currentTime = 0;
    }
}


function update() {
    var blinkOn = ship.blinkNum % 2 == 0;
    var exploding = ship.explodeTime > 0;

    // tick the music
    music.tick();

    // draw space
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canv.clientWidth, canv.height);
    // thrust ship
    if (ship.thrusting && !ship.dead) {
        ship.thrust.x += shipThrust * Math.cos(ship.a) / FPS;
        ship.thrust.y -= shipThrust * Math.sin(ship.a) / FPS;
        fxThrust.play();

        // draw the thruster
        if (!exploding && blinkOn) {
            ctx.fillStyle = 'red';
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = shipSize / 10;
            ctx.beginPath();
            ctx.moveTo( // rear left
            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
            ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
            );
            ctx.lineTo( // rear center behind ship
            ship.x - ship.r * 6 / 3 * Math.cos(ship.a),
            ship.y + ship.r * 6 / 3 * Math.sin(ship.a)
            );
            ctx.lineTo( // rear right
            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
            ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
            );
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

    } else {
        // apply friction
        ship.thrust.x -= friction * ship.thrust.x / FPS;
        ship.thrust.y -= friction * ship.thrust.y / FPS;
        fxThrust.stop();
    }


    // draw the triangular ship
    if (!exploding) {
        if(blinkOn && !ship.dead) {
            drawShip(ship.x, ship.y, ship.a);
        }

        // handle blinking 
        if(ship.blinkNum > 0) {

            // reduce blink time
                ship.blinkTime--;

                // reduce the blink num
                if(ship.blinkTime == 0) {
                    ship.blinkTime = Math.ceil(shipBlinkDur * FPS);
                    ship.blinkNum--;
                }
        }
                    } else {
                        // draw explosion
                        ctx.fillStyle = 'darkred';
                        ctx.beginPath();
                        ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
                        ctx.fill();
                        ctx.fillStyle = 'red';
                        ctx.beginPath();
                        ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
                        ctx.fill();
                        ctx.fillStyle = 'orange';
                        ctx.beginPath();
                        ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
                        ctx.fill();
                        ctx.fillStyle = 'yellow';
                        ctx.beginPath();
                        ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
                        ctx.fill();
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
                        ctx.fill();
                    }

if (showBounding) {
    ctx.strokeStyle = 'lime';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
    ctx.stroke();
}

// draw the asteroids
var a, r, x, y, offs, vert;
for (var i = 0; i < asteroids.length; i++) {
    ctx.strokeStyle = 'slategrey';
    ctx.lineWidth = shipSize / 20;
    // get the asteroid properties
x = asteroids[i].x;
y = asteroids[i].y;
r = asteroids[i].r;
a = asteroids[i].a;
vert = asteroids[i].vert;
offs = asteroids[i].offs;
    // draw a path
ctx.beginPath();
ctx.moveTo(
x + r * offs[0] * Math.cos(a),
y + r * offs[0] * Math.sin(a)
);

    // draw the polygon
    for (var j = 1; j < vert; j++) {
        ctx.lineTo(
            x + r * offs[j] * Math.cos(a + j * Math.PI * 2/ vert),
            y + r * offs[j] * Math.sin(a + j * Math.PI * 2/ vert),
        );
    }
    ctx.closePath();
    ctx.stroke();

    if (showBounding) {
        ctx.strokeStyle = 'lime';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2, false);
        ctx.stroke();
    } 
}

 // center dot
 if (showCenterDot) {
    ctx.fillStyle = 'red';
    ctx.fillRect(ship.x -1, ship.y - 1, 2, 2);
    }

// draw the lasers
for(var i = 0; i < ship.lasers.length; i++) {
    if (ship.lasers[i].explodeTime == 0) {
        ctx.fillStyle = 'salmon';
        ctx.beginPath();
        ctx.arc(ship.lasers[i].x, ship.lasers[i].y, shipSize / 15, 0, Math.PI * 2, false);
        ctx.fill();
    } else {
        // draw the explosion
        ctx.fillStyle = 'orangered';
        ctx.beginPath();
        ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = 'salmon';
        ctx.beginPath();
        ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.fillStyle = 'pink';
        ctx.beginPath();
        ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.25, 0, Math.PI * 2, false);
        ctx.fill();
    }
}

// draw the game text
if (textAlpha >= 0) {
    ctx.textAlign = 'center';
    ctx.textBaseAlign = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, ' + textAlpha + ')';
    ctx.font = `${textSize}px silkscreen`;
    ctx.fillText(text, canv.width / 2, canv.height * 0.75);
    textAlpha -= (1.0 / textFadeTime / FPS);
} else if (ship.dead) {
    newGame();
}

// draw the lives
var lifeColor;
for (var i = 0; i < lives; i++) {
    lifeColor = exploding && i == lives - 1 ? 'red' : 'white';
    drawShip(shipSize + i * shipSize * 1.2, shipSize, 0.5 * Math.PI, lifeColor);
}

// draw the score
ctx.textAlign = 'right';
ctx.textBaseAlign = 'middle';
ctx.fillStyle = 'white';
ctx.font = `${textSize}px silkscreen`;
ctx.fillText(score, canv.width - shipSize / 2, shipSize);

// draw the high score
ctx.textAlign = 'center';
ctx.textBaseAlign = 'middle';
ctx.fillStyle = 'white';
ctx.font =  `${textSize * 0.75}px silkscreen`;
ctx.fillText('Best ' + scoreHigh, canv.width / 2, shipSize);

// detect laser hits on asteroids
var ax, ay, ar, lx, ly;
for (var i = asteroids.length - 1; i >= 0; i--) {

    // grab the asteroid properties
    ax = asteroids[i].x;
    ay = asteroids[i].y;
    ar = asteroids[i].r;

    // loop over the lasers 
    for (var j = ship.lasers.length -1; j >= 0; j--) {

        // grab the laser properties
        lx = ship.lasers[j].x;
        ly = ship.lasers[j].y;

        // detect hits
        if (ship.lasers[j].explodeTime == 0 &&distBetweeenPoints(ax, ay, lx, ly) < ar) {

            // destroy the asteroid and activate the laser explosion
            destroyAsteroid(i);
            ship.lasers[j].explodeTime = Math.ceil(laserExplodeDur * FPS);
            break;
        }
    }
}
// check for asteroid collisions
    if (!exploding) {

        // only check when not blinking
        if (ship.blinkNum == 0 && !ship.dead) {
            for (var i = 0; i < asteroids.length; i++) {
                if (distBetweeenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < ship.r + asteroids[i].r) {
                    explodeShip();
                    destroyAsteroid(i);
                    break;
                }
        }
    }
            // rotate ship
            ship.a += ship.rotation;

            // move ship
            ship.x += ship.thrust.x;
            ship.y += ship.thrust.y;

} else {
    ship.explodeTime--;

// reset the ship after the explosion has finished
    if (ship.explodeTime == 0) {
        lives--;
        if (lives == 0) {
            gameOver();
        } else {
            ship = newShip();
        }
    }
}
    // handle ship edge of screen
    if (ship.x < 0 - ship.r) {
        ship.x = canv.width + ship.r;
    } else if (ship.x > canv.width + ship.r) {
        ship.x = 0 - ship.r;
    }
    if (ship.y < 0 - ship.r) {
        ship.y = canv.height + ship.r;
    } else if (ship.y > canv.height + ship.r) {
        ship.y = 0 - ship.r;
    }

    // move the lasers 
    for (var i = ship.lasers.length -1; i >= 0; i--) {
        // check distance traveled 
        if (ship.lasers[i].dist > laserDist * canv.width) {
            ship.lasers.splice(i, 1);
            continue;
        }

        // handle the explosion
        if (ship.lasers[i].explodeTime > 0) {
            ship.lasers[i].explodeTime--;

            // destroy the laser after the duration is up
            if (ship.lasers[i].explodeTime == 0) {
                ship.lasers.splice(i, 1);
                continue;
            }

        } else {
            // move the laser
            ship.lasers[i].x += ship.lasers[i].xv;
            ship.lasers[i].y += ship.lasers[i].yv;

            // calculate the  distance traveled
            ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));
        }
        // handle edge of screen
        if (ship.lasers[i].x < 0) {
            ship.lasers[i].x = canv.width;
        } else if (ship.lasers[i].x > canv.width) {
            ship.lasers[i].x = 0;
        }
        if (ship.lasers[i].y < 0) {
            ship.lasers[i].y = canv.height;
        } else if (ship.lasers[i].y > canv.height) {
            ship.lasers[i].y = 0;
        }
    }

    // move the asteroids
    for (var i = 0; i < asteroids.length; i++) {
        asteroids[i].x += asteroids[i].xv;
        asteroids[i].y += asteroids[i].yv;

        // handle asteroid edge of screen
        if (asteroids[i].x < 0 - asteroids[i].r) {
            asteroids[i].x = canv.width + asteroids[i].r;
                } else if (asteroids[i].x > canv.width + asteroids[i].r) {
                asteroids[i].x = 0 - asteroids[i].r
                }
        if (asteroids[i].y < 0 - asteroids[i].r) {
            asteroids[i].y = canv.height + asteroids[i].r;
                } else if (asteroids[i].y > canv.height + asteroids[i].r) {
                asteroids[i].y = 0 - asteroids[i].r
                }
}
}