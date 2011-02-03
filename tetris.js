/*
 * A JavaScript Tetris clone.
 *
 * Requires: jQuery 1.4.2, Sylvester 0.1.3
 */

/*global $, $V, window */

var ROWS = 20,
    COLS = 10,
    CELL_W,
    CELL_H,

    REFRESH_HZ = 12,
    DEBUG,// = true,

    KEYS = {
        pause: 32,
        rotate: 38,
        drop: 40,
        left: 37,
        right: 39
    };

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

        if (DEBUG && this.isAxis) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth /= CELL_W;
            ctx.drawLine(this.x, this.y, this.x + 1, this.y + 1);
            ctx.drawLine(this.x, this.y + 1, this.x + 1, this.y);
        }

        ctx.restore();
    },

    toString: function () {
        return 'Tile[x=' + this.x + ', y=' + this.y +
               ', colour=' + this.colour + ']';
    }
};

/// pieces

function Piece(shape) {

    this.shape = shape;

    var colour, layout;
    switch (shape) {
    case 'I':
        layout = [
            '#X##'
        ];
        colour = '#F00';
        break;
    case 'J':
        layout = [
            '#X#',
            '  #'
        ];
        colour = '#FF0';
        break;
    case 'L':
        layout = [
            '#X#',
            '#  '
        ];
        colour = '#F0F';
        break;
    case 'O':
        layout = [
            '##',
            '##'
        ];
        colour = '#00F';
        break;
    case 'S':
        layout = [
            ' X#',
            '## '
        ];
        colour = '#0FF';
        break;
    case 'T':
        layout = [
            '#X#',
            ' # '
        ];
        colour = '#0F0';
        break;
    case 'Z':
        layout = [
            '#X ',
            ' ##'
        ];
        colour = '#F90';
        break;
    default:
        throw new Error('unknown shape: ' + shape);
    }

    this.tiles = [];
    var row, x, y;
    for (y = 0; y < layout.length; y++) {
        row = layout[y];
        for (x = 0; x < row.length; x++) {
            if (row[x] === ' ') {
                continue;
            }
            var tile = new Tile(x, y, colour);
            this.tiles.push(tile);
            if (row[x] === 'X') {
                this.axis = tile;
                tile.isAxis = true;
            }
        }
    }
    this.w = x;
    this.h = y;
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
            ctx.strokeRect(0, 0, this.w * CELL_W, this.h * CELL_H);
        }

        ctx.restore();
    },

    rotate: function () {
        if (!this.axis) {
            return;
        }

        var angle = 3 * Math.PI / 2;

        /* The 'I', 'S' and 'Z' pieces are a bit special. They don't really
           rotate all the way around an axis. They alternate between fixed
           horizontal and vertical orientations. */
        if ('ISZ'.indexOf(this.shape) !== -1 && this.h > this.w) {
            // return to previous orientation
            angle *= -1;
        }

        var axis = $V([this.axis.x, this.axis.y]);

        this.tiles.forEach(function (t) {
            var v = $V([t.x, t.y]).rotate(angle, axis).round();
            t.x = v.e(1);
            t.y = v.e(2);
        });

        // recalculate position and dimensions based on new tile layout

        var xs = this.tiles.map(function (t) { return t.x; }),
            minX = Math.min.apply(null, xs),
            maxX = Math.max.apply(null, xs),
            ys = this.tiles.map(function (t) { return t.y; }),
            minY = Math.min.apply(null, ys),
            maxY = Math.max.apply(null, ys);

        this.x += minX;
        this.y += minY;

        this.w = maxX - minX + 1;
        this.h = maxY - minY + 1;

        this.tiles.forEach(function (tile) {
            tile.x -= minX;
            tile.y -= minY;
        });
    },

    collidesWith: function (tile) {
        var thisX = this.x, thisY = this.y;
        return (
            // bounds check
            thisX <= tile.x && tile.x <= thisX + this.w &&
            thisY <= tile.y && tile.y <= thisY + this.h &&
            // per-tile check
            this.tiles.some(function (t) {
                return tile.x === thisX + t.x && tile.y === thisY + t.y;
            }));
    },

    toString: function () {
        return 'Piece[shape=' + this.shape + ',x=' + this.x + ',y=' + this.y +
               ',w=' + this.w + ',h=' + this.h + ']';
    }
};

Piece.random = function () {
    var shapes = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return new Piece(shapes[Math.floor(Math.random() * shapes.length)]);
};

/// playing area

function Grid(w, h) {
    this.w = w;
    this.h = h;

    this.msSinceLastStep = 0;

    this.tiles = [];
    this.currentPiece = this.fetchNext();
}

Grid.prototype = {

    draw: function (ctx) {
        ctx.save();

        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, this.w * CELL_W, this.h * CELL_H);

        if (DEBUG) {
            // draw gridlines
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 0.5;
            for (var x = 1; x < this.w; x++) {
                ctx.drawLine(x * CELL_W, 0, x * CELL_W, this.h * CELL_H);
            }
            for (var y = 1; y < this.h; y++) {
                ctx.drawLine(0, y * CELL_H, this.w * CELL_W, y * CELL_H);
            }
        }

        this.tiles.forEach(function (tile) {
            tile.draw(ctx);
        });
        this.currentPiece.draw(ctx);

        ctx.restore();
    },

    update: function (delta) {
        this.msSinceLastStep += delta;
        if (this.msSinceLastStep < 500) {
            return;
        }

        if (!this.movePiece(0, 1)) {
            this.landPiece();
        }

        this.msSinceLastStep = 0;
    },

    // check that a piece is in a valid position
    validPos: function (piece) {
        return !(
            piece.x < 0 || this.w < piece.x + piece.w ||
            piece.y < 0 || this.h < piece.y + piece.h ||
            this.tiles.some(function (tile) {
                return piece.collidesWith(tile);
            }));
    },

    rotatePiece: function () {
        this.currentPiece.rotate();
    },

    // attempt move and return flag indicating move validity
    movePiece: function (dx, dy) {
        var currentPiece = this.currentPiece;

        currentPiece.x += dx;
        currentPiece.y += dy;

        if (this.validPos(currentPiece)) {
            return true;
        } else {
            // rollback
            currentPiece.x -= dx;
            currentPiece.y -= dy;
            return false;
        }
    },

    fetchNext: function () {
        var next = Piece.random();

        next.x = Math.floor((this.w - next.w) / 2);
        next.y = 0;

        if (this.validPos(next)) {
            return next;
        } else {
            // game over
            this.full = true;
            return null;
        }
    },

    dropPiece: function () {
        while (this.movePiece(0, 1)) {
            // to the bottom
        }
        this.landPiece();
    },

    landPiece: function () {
        var currentPiece = this.currentPiece;
        // consume tiles
        var tiles = this.tiles;
        currentPiece.tiles.forEach(function (tile) {
            tiles.push(tile);
            tile.x += currentPiece.x;
            tile.y += currentPiece.y;
        });

        /* group tiles into rows, eliminating full rows bottom to
           top, shifting subsequent rows downwards */

        var rows = [];
        tiles.forEach(function (tile) {
            var y = tile.y;
            if (!rows[y]) {
                rows[y] = [];
            }
            rows[y].push(tile);
        });

        rows.reverse();
        tiles.splice(0, tiles.length);
        var nEliminatedRows = 0;
        var nMaxRowTiles = this.w;
        rows.forEach(function (row) {
            if (row.length === nMaxRowTiles) {
                nEliminatedRows++;
            } else {
                row.forEach(function (tile) {
                    // shift tiles downwards
                    tile.y += nEliminatedRows;
                    // re-add to master collection
                    tiles.push(tile);
                });
            }
        });

        this.currentPiece = this.fetchNext();
    }
};

/// initialisation

var grid;

$(function () {
    var canvas = $('canvas').get(0);
    var ctx = canvas.getContext('2d');
    // augment context object - probably a bad idea
    ctx.drawLine = function (x1, y1, x2, y2) {
        this.beginPath();
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
        this.stroke();
    };

    CELL_W = canvas.width / COLS;
    CELL_H = canvas.height / ROWS;

    grid = new Grid(COLS, ROWS);

    // reverse-keycode index
    var keycodes = {};
    for (var k in KEYS) {
        keycodes[KEYS[k]] = k;
    }

    var commandQueue = [];
    var paused;

    $(window).keydown(function (e) {
        var k = e.which;
        if (!keycodes[k]) {
            return;
        }

        //console.log('pressed ' + keycodes[k]);
        e.preventDefault();

        if (k === KEYS.pause) {
            // execute immediately
            paused = !paused;
        } else if (!paused) {
            // save game-level commands for later
            commandQueue.push(k);
        }
    });

    function processPendingCommands() {
        var k;
        while ((k = commandQueue.shift())) {
            switch (k) {
            case KEYS.rotate:
                grid.rotatePiece();
                break;
            case KEYS.drop:
                grid.dropPiece();
                break;
            case KEYS.left:
                grid.movePiece(-1, 0);
                break;
            case KEYS.right:
                grid.movePiece(1, 0);
                break;
            default:
                throw new Error('unmapped keycode: ' + k);
            }
        }
    }

    var delay = 1000 / REFRESH_HZ;
    var lastLoopTime = new Date().getTime();

    function loop() {
        var now = new Date();
        if (!paused) {
            processPendingCommands();
            //grid.update(now - lastLoopTime);
        }
        if (!grid.full) {
            lastLoopTime = now;
            grid.draw(ctx);
            window.setTimeout(loop, delay);
        }
    }

    window.setTimeout(loop, delay);
});

