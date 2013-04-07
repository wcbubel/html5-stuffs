(function main(global) {
//------------------------------------------------------------------------------

var KEYCODES = {
    13: "return",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
}

var GAME_WIDTH = 448, GAME_HEIGHT = 480;

//------------------------------------------------------------------------------

var Util = {}

Util.boundingRectsOverlap = function(l1, t1, w1, h1, l2, t2, w2, h2) {
    var r1 = l1+w1, b1 = t1+h1;
    var r2 = l2+w2, b2 = t2+h2;
    return (!((l1 > r2) || (l2 > r1) || (t1 > b2) ||(t2 > b1)))
}

Util.getDisplacementVector = function(l1, t1, w1, h1, l2, t2, w2, h2) {
    var c1x = l1 + w1 / 2, c2x = l2 + w2 / 2
    var c1y = t1 + h1 / 2, c2y = t2 + h2 / 2
    var dx = l2 - l1 + ((c1x < c2x) ? -w1 : w2);
    var dy = t2 - t1 + ((c1y < c2y) ? -h1 : h2);
    var ax = Math.abs(dx), ay = Math.abs(dy);
    if (ax < ay) {
        return [dx, 0];
    }
    else {
        return [0, dy];
    }
}

//------------------------------------------------------------------------------

var Graphics = (function(Graphics) {

    var canvas = null;
    var ctx = null;

    Graphics.init = function() {
        canvas = document.getElementById("gamecanvas");
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        ctx = canvas.getContext("2d");

        Graphics.clearCanvas();
    }

    Graphics.clearCanvas = function(color, x, y, w, h) {
        x = x || 0;
        y = y || 0;
        w = w || GAME_WIDTH;
        h = h || GAME_HEIGHT;
        color = color || "#000000";
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill()
    }

    Graphics.drawBall = function(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI*2);
        ctx.closePath();
        ctx.fillStyle = "#ffcc99";
        ctx.fill();
    }

    Graphics.drawPaddle = function(x, y, width) {
        var half = Math.floor(width/2)
        ctx.beginPath();
        ctx.rect(x-half, y, width, 12);
        ctx.closePath();
        ctx.fillStyle = "#ccffff";
        ctx.fill()
    }

    Graphics.drawBrick = function(color, x, y, w, h) {
        ctx.beginPath();
        ctx.rect(x+1, y+1, w-2, h-2);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill()
    }

    Graphics.writeText = function(text, x, y) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.fillText(text, x, y);
        ctx.closePath();
    }

    return Graphics;

})({});

//------------------------------------------------------------------------------

var Paddle = (function() {

    function Paddle(game) {
        this.x = Math.floor(GAME_WIDTH/2);
        this.y = 400;
        this.dx = 0;
        this.width = 40;
        this.game = game;
    }

    Paddle.prototype.update = function() {
        if (this.game.isDown("left")) {
            this.dx = -4;
        }
        else if (this.game.isDown("right")) {
            this.dx = 4;
        }
        else {
            this.dx = 0;
        }

        this.x += this.dx;

        if (this.x < 0) { this.x = 0; }
        else if (this.x > GAME_WIDTH) { this.x = GAME_WIDTH; }
    }

    Paddle.prototype.draw = function() {
        Graphics.drawPaddle(this.x, this.y, this.width);
    }

    return Paddle;

})();

//------------------------------------------------------------------------------

var Ball = (function() {

    function Ball(game) {
        this.x = Math.floor(GAME_WIDTH/2);
        this.y = 340;
        this.dx = -2;
        this.dy = -2;
        this.game = game;
    }

    Ball.prototype.update = function() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.dx < 0 && this.x <= 0) { this.dx *= -1; }
        if (this.dx > 0 && this.x >= GAME_WIDTH) { this.dx *= -1; }
        if (this.dy < 0 && this.y <= 0) { this.dy *= -1; }
        if (this.dy > 0 && this.y >= GAME_HEIGHT) {
            this.game.lives -= 1;
            if (this.game.lives > 0) {
                this.x = Math.floor(GAME_WIDTH/2);
                this.y = 340;
                this.dx = -2;
                this.dy = -2;
            }
            else {
                this.x = Math.floor(GAME_WIDTH/2);
                this.y = 340;
                this.dx = 0;
                this.dy = 0;
            }
        }

        this.checkPaddleCollision();
        this.checkBrickCollision();
    }

    Ball.prototype.draw = function() {
        Graphics.drawBall(this.x, this.y);
    }

    Ball.prototype.checkPaddleCollision = function() {
        if (this.dy < 0) { return; }
        var pw = this.game.paddle.width, ph = 10;
        var px = this.game.paddle.x, py = this.game.paddle.y;
        var phalf = Math.floor(pw/2);
        var pl = px - phalf

        if (Util.boundingRectsOverlap(this.x - 5, this.y - 4, 10, 8, pl, py, pw, ph)) {
            this.y = py;
            this.dx = Math.ceil(((this.x-px)/phalf)*4)
            this.dy = -1 * Math.max(1, 4-Math.abs(this.dx))
        }
    }

    Ball.prototype.checkBrickCollision = function() {
        var bx = Math.floor(this.x/32)*32, by = Math.floor((this.y)/16)*16
        if (!this.game.wall.isBrickAt(bx, by)) {
            return;
        }

        this.game.wall.knockoutBrickAt(bx, by)
        var dv = Util.getDisplacementVector(this.x-4, this.y-4, 8, 8, bx, by, 32, 16);
        var dx = dv[0], dy = dv[1];
        if (dy > 0 && this.dy < 0) {
            this.dy *= -1;
            this.y += dy;
        }
        else if (dy < 0 && this.dy > 0) {
            this.dy *= -1;
            this.y += dy;
        }
        if (dx > 0 && this.dx < 0) {
            this.dx *= -1;
            this.x += dx;
        }
        else if (dx < 0 && this.dx > 0) {
            this.dx *= -1;
            this.x += dx;
        }
    }
    
    return Ball

})();

//------------------------------------------------------------------------------

var Wall = (function() {

    var ROWS = 8, COLUMNS = 14;

    var ROWCOLOR = [
        "#ff0000", "#cc0000", // red
        "#ff9900", "#cc9900", // orange
        "#00ff00", "#00cc00", // green
        "#ffff00", "#ffcc00", // yellow
    ]

    function Wall(game) {
        this.game = game;
        this.rows = []
        for (var i = 0; i<ROWS; i++) {
            this.rows[i] = [];
            for (var j = 0; j<COLUMNS; j++) {
                this.rows[i][j] = true;
            }
        }
    }

    Wall.prototype.draw = function() {
        for (var i = 0; i<ROWS; i++) {
            for (var j = 0; j<COLUMNS; j++) {
                if (this.rows[i][j] === true) {
                    Graphics.drawBrick(ROWCOLOR[i], j*32, 32+i*16, 32, 16);
                }
            }
        }
    }

    Wall.prototype.isBrickAt = function(x, y) {
        var bx = Math.floor(x/32), by = Math.floor((y-32)/16)
        if (bx >= 0 && bx < COLUMNS && by >= 0 && by < ROWS) {
            return this.rows[by][bx];
        }
        return false;
    }

    Wall.prototype.knockoutBrickAt = function(x, y) {
        var bx = Math.floor(x/32), by = Math.floor((y-32)/16)
        if (bx >= 0 && bx < COLUMNS && by >= 0 && by < ROWS) {
            this.rows[by][bx] = false;
            this.game.score += (1+(3-Math.floor(by/2))*2)
        }
    }

    return Wall;

})();

//------------------------------------------------------------------------------

var Game = (function() {

    function Game() {
        this.paddle = new Paddle(this);
        this.ball = new Ball(this);
        this.wall = new Wall(this);
        this.keys = {};
        for (k in KEYCODES) {
            this.keys[KEYCODES[k]] = false;
        }
        this.lives = 3;
        this.score = 0;
        this.clock = 0;
    }

    Game.prototype.tick = function() {
        this.update();
        this.draw();
    }

    Game.prototype.update = function() {
        if (this.clock < 120) {
            this.clock += 1;
        }
        else if (this.lives > 0) {
            this.paddle.update();
            this.ball.update();
        }
    }

    Game.prototype.draw = function() {
        Graphics.clearCanvas();
        this.wall.draw();
        this.paddle.draw();
        this.ball.draw();
        Graphics.writeText("LIVES: "+this.lives, 8, GAME_HEIGHT - 16);
        Graphics.writeText("SCORE: "+this.score, GAME_WIDTH-96, GAME_HEIGHT - 16);
        if (this.clock < 120) {
            Graphics.writeText("GET READY", GAME_WIDTH/2-40, GAME_HEIGHT/2);
        }
        if (this.lives <= 0) {
            Graphics.writeText("GAME OVER", GAME_WIDTH/2-40, GAME_HEIGHT/2);
        }
    }

    Game.prototype.keydown = function(evt) {
        if (evt.keyCode in KEYCODES) {
            this.keys[KEYCODES[evt.keyCode]] = true;
        }
    }

    Game.prototype.keyup = function(evt) {
        if (evt.keyCode in KEYCODES) {
            this.keys[KEYCODES[evt.keyCode]] = false;
        }
    }

    Game.prototype.isDown = function() {
        for (var i = 0; i < arguments.length; i++) {
            if (this.keys[arguments[i]] === true) {
                return true;
            }
        }
        return false;
    }

    return Game;

})();

//------------------------------------------------------------------------------

global.onload = function() {

    Graphics.init();
    var game = new Game();

    global.addEventListener('keydown', game.keydown.bind(game), true);
    global.addEventListener('keyup', game.keyup.bind(game), true);

    var tickID = global.setInterval(game.tick.bind(game), 16)

}

//------------------------------------------------------------------------------
})(window);
