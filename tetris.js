/*
 * A JavaScript Tetris clone.
 *
 * Requires: jQuery 1.4.2, Sylvester 0.1.3
 */

/*global $, $V, window */

function charCode(c) {
    return c.charCodeAt(0);
}

var ROWS = 20,
    COLS = 10,
    ROWS_PER_LEVEL = 10,

    REFRESH_HZ = 12,
    DEBUG = false,

    KEYS = {
        rotateLeft:  charCode('Z'),
        rotateRight: charCode('X'),
        moveLeft:    37, // left arrow
        moveRight:   39, // right arrow
        drop:        32, // space

        toggleDebug: charCode('D'),
        togglePause: charCode('P'),
        newGame:     charCode('N')
    },
    // reverse-lookup
    KEYCODES = {},

    CELL_W,
    CELL_H,

    commandQueue = [],

    grid,
    level,
    rowsRemaining,
    score,
    paused;

for (var k in KEYS) {
    KEYCODES[KEYS[k]] = k;
}

/// misc

function calcPoints(level, nCleared, nDropped) {
    /* Simplified scoring system based on number of lines cleared and number of
       grid rows dropped. Don't bother with T-spins etc. */
    var pointsPerLine = [0, 40, 100, 300, 1200];
    var n = pointsPerLine[nCleared];
    return nDropped + n * level;
}

function processPendingCommands() {
    var k;
    while ((k = commandQueue.shift())) {
        switch (k) {
        case KEYS.rotateLeft:
            grid.rotatePiece(1);
            break;
        case KEYS.rotateRight:
            grid.rotatePiece(-1);
            break;
        case KEYS.drop:
            grid.dropPiece();
            break;
        case KEYS.moveLeft:
            grid.movePiece(-1, 0);
            break;
        case KEYS.moveRight:
            grid.movePiece(1, 0);
            break;
        default:
            throw new Error('unmapped keycode: ' + k);
        }
    }
}

/// tiles

function Tile(x, y, colour) {
    this.x = x;
    this.y = y;
    this.colour = colour;
}

Tile.prototype = {

    draw: function (ctx) {
        ctx.save();

        ctx.scale(CELL_W, CELL_H);
        ctx.fillStyle = this.colour;
        ctx.fillRect(this.x, this.y, 1, 1);

        ctx.restore();
    },

    toString: function () {
        return 'Tile[x=' + this.x + ', y=' + this.y +
               ', colour=' + this.colour + ']';
    }
};

/*
 * Pieces are defined as a collection of tiles arranged within a logical
 * bounding square. This allows rotation according to the so-called Super
 * Rotation System (http://tetris.wikia.com/wiki/SRS).
 */

function Piece(shape) {

    this.shape = shape;

    var layout, colour;
    switch (shape) {
    case 'I':
        layout = [
            '####'
        ];
        colour = 'red';
        break;
    case 'J':
        layout = [
            '#  ',
            '###'
        ];
        colour = 'yellow';
        break;
    case 'L':
        layout = [
            '  #',
            '###'
        ];
        colour = 'magenta';
        break;
    case 'O':
        layout = [
            '##',
            '##'
        ];
        colour = 'blue';
        break;
    case 'S':
        layout = [
            ' ##',
            '## '
        ];
        colour = 'cyan';
        break;
    case 'T':
        layout = [
            ' # ',
            '###'
        ];
        colour = 'lime';
        break;
    case 'Z':
        layout = [
            '## ',
            ' ##'
        ];
        colour = 'orange';
        break;
    default:
        throw new Error('unknown shape: ' + shape);
    }

    // offset I-piece towards centre of bounding square
    var yOffset = shape === 'I' ? 1 : 0;

    this.tiles = [];
    var row, x, y;
    for (y = 0; y < layout.length; y++) {
        row = layout[y];
        for (x = 0; x < row.length; x++) {
            if (row[x] === '#') {
                this.tiles.push(new Tile(x, y + yOffset, colour));
            }
        }
    }

    this.size = Math.max(x, y);
    this.x = Math.floor((COLS - this.size) / 2);
    this.y = 0; // FIXME: calculate according to size, offset
}

Piece.prototype = {

    draw: function (ctx) {
        ctx.save();
        ctx.translate(this.x * CELL_W, this.y * CELL_H);

        this.tiles.forEach(function (t) {
            t.draw(ctx);
        });

        if (DEBUG) {
            // bounding box
            ctx.strokeStyle = '#000';
            ctx.strokeRect(0, 0, this.size * CELL_W, this.size * CELL_H);
        }

        ctx.restore();
    },

    rotate: function (steps) {
        var angle = steps * 3 * Math.PI / 2;
        var centre = (this.size - 1) / 2;
        var axis = $V([centre, centre]);

        this.tiles.forEach(function (t) {
            var v = $V([t.x, t.y]).rotate(angle, axis).round();
            t.x = v.e(1);
            t.y = v.e(2);
        });
    },

    outOfBounds: function () {
        var xs = this.tiles.map(function (t) { return t.x; });
        var ys = this.tiles.map(function (t) { return t.y; });
        return (
            Math.min.apply(null, xs) + this.x < 0 ||
            //Math.min.apply(null, ys) + this.y < 0 ||
            COLS <= Math.max.apply(null, xs) + this.x ||
            ROWS <= Math.max.apply(null, ys) + this.y);
    },

    collidesWith: function (tile) {
        var x = this.x, y = this.y;
        return (
            // bounds check
            x <= tile.x && tile.x <= x + this.size &&
            y <= tile.y && tile.y <= y + this.size &&
            // per-tile check
            this.tiles.some(function (t) {
                return tile.x === x + t.x && tile.y === y + t.y;
            }));
    },

    toString: function () {
        return 'Piece[shape=' + this.shape + ', x=' + this.x + ', y=' + this.y +
               ', size=' + this.size + ']';
    }
};

Piece.random = function () {
    var shapes = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return new Piece(shapes[Math.floor(Math.random() * shapes.length)]);
};

/// playing area

function Grid() {
    this.msSinceLastStep = 0;
    this.tiles = [];
    this.currentPiece = this.fetchNext();
}

Grid.prototype = {

    draw: function (ctx) {
        ctx.save();

        ctx.scale(CELL_W, CELL_H);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, COLS, ROWS);

        if (DEBUG) {
            // draw gridlines
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 0.5 / CELL_W;
            for (var x = 1; x < COLS; x++) {
                ctx.drawLine(x, 0, x, ROWS);
            }
            for (var y = 1; y < ROWS; y++) {
                ctx.drawLine(0, y, COLS, y);
            }
        }

        ctx.restore();

        this.tiles.forEach(function (t) {
            t.draw(ctx);
        });
        this.currentPiece.draw(ctx);

        // FIXME: should look nicer
        ctx.font = 'bold 10px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Score: ' + score, 5, 5);
        ctx.fillText('Level: ' + level, 5, 20);

        if (paused) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('<Paused>', COLS * CELL_W / 2, ROWS * CELL_H / 2);
        }
    },

    update: function (delta) {
        this.msSinceLastStep += delta;
        // TODO: speed should be based on current level
        if (this.msSinceLastStep < 500) {
            return;
        }

        if (!this.movePiece(0, 1)) {
            this.consumePiece();
        }

        this.msSinceLastStep = 0;
    },

    colliding: function (piece) {
        return this.tiles.some(function (t) {
            return piece.collidesWith(t);
        });
    },

    // attempt rotation
    rotatePiece: function (steps) {
        var piece = this.currentPiece;

        piece.rotate(steps);

        if (this.colliding(piece) ||
            (piece.outOfBounds() &&
             // try wall kick
             !(this.movePiece(1, 0) || this.movePiece(-1, 0)))) {
            // rollback
            this.currentPiece.rotate(-steps);
        }
    },

    // attempt move and return flag indicating move validity
    movePiece: function (dx, dy) {
        var piece = this.currentPiece;

        piece.x += dx;
        piece.y += dy;

        var valid = !(piece.outOfBounds() || this.colliding(piece));

        if (!valid) {
            // rollback
            piece.x -= dx;
            piece.y -= dy;
        }

        return valid;
    },

    fetchNext: function () {
        var next = Piece.random();

        if (this.colliding(next)) {
            // game over
            this.full = true;
            return null;
        }

        return next;
    },

    dropPiece: function () {
        var nRowsDropped = 0;
        while (this.movePiece(0, 1)) {
            nRowsDropped++;
        }
        this.consumePiece(nRowsDropped);
    },

    consumePiece: function (nRowsDropped) {
        var piece = this.currentPiece;
        // consume tiles
        var tiles = this.tiles;
        piece.tiles.forEach(function (t) {
            tiles.push(t);
            t.x += piece.x;
            t.y += piece.y;
        });

        /* group tiles into rows, eliminate full rows working from bottom to
           top, shift subsequent rows downwards */

        var rows = [];
        tiles.forEach(function (t) {
            var y = t.y;
            if (!rows[y]) {
                rows[y] = [];
            }
            rows[y].push(t);
        });

        rows.reverse();
        tiles.splice(0, tiles.length);
        var nRowsCleared = 0;
        rows.forEach(function (row) {
            if (row.length === COLS) {
                nRowsCleared++;
            } else {
                row.forEach(function (t) {
                    // shift tiles downwards
                    t.y += nRowsCleared;
                    // re-add to master collection
                    tiles.push(t);
                });
            }
        });

        score += calcPoints(level, nRowsCleared, nRowsDropped || 0);

        rowsRemaining -= nRowsCleared;
        if (rowsRemaining <= 0) {
            level++;
            rowsRemaining = ROWS_PER_LEVEL;
        }

        this.currentPiece = this.fetchNext();
    }
};

/// initialisation

var loopTimer,
    ctx;

function newGame() {
    window.clearTimeout(loopTimer);

    grid = new Grid();
    level = 1;
    rowsRemaining = ROWS_PER_LEVEL;
    score = 0;
    paused = false;

    var delay = 1000 / REFRESH_HZ;
    var lastLoopTime = new Date();

    function loop() {
        var now = new Date();
        if (!paused) {
            processPendingCommands();
            grid.update(now - lastLoopTime);
        }
        if (!grid.full) {
            grid.draw(ctx);
            lastLoopTime = now;
            loopTimer = window.setTimeout(loop, delay);
        }
    }

    loopTimer = window.setTimeout(loop, delay);
}

$(function () {
    var canvas = $('canvas').get(0);
    ctx = canvas.getContext('2d');
    // augment context object - maybe a bad idea
    ctx.drawLine = function (x1, y1, x2, y2) {
        this.beginPath();
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
        this.stroke();
    };

    CELL_W = canvas.width / COLS;
    CELL_H = canvas.height / ROWS;

    $(window).keydown(function (e) {
        var k = e.which;
        if (!KEYCODES[k]) {
            return;
        }

        //console.log('pressed ' + keycodes[k]);
        e.preventDefault();

        if (k === KEYS.togglePause) {
            // execute immediately
            paused = !paused;
        } else if (k === KEYS.toggleDebug) {
            DEBUG = !DEBUG;
        } else if (k === KEYS.newGame) {
            newGame();
        } else if (!paused) {
            // save game-level commands for later
            commandQueue.push(k);
        }
    });

    newGame();
});

