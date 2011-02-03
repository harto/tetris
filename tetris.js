/*
 * A JavaScript Tetris clone.
 * http://www.harto.org/
 */

/*global $, window */

var ROWS = 20,
    COLS = 10,
    CELL_W,
    CELL_H,

    REFRESH_HZ = 12,

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

    render: function (ctx) {
        ctx.save();

        ctx.fillStyle = this.colour;
        ctx.fillRect(this.x * CELL_W, this.y * CELL_H, CELL_W, CELL_H);

        ctx.restore();
    },

    toString: function () {
        return 'Tile[x=' + this.x + ',y=' + this.y + ',colour=' + this.colour + ']';
    }
};

/// pieces

function Piece(shape) {

    this.shape = shape;

    var colour, layout;
    switch (shape) {
    case 'I':
        layout = [
            '####'
        ];
        colour = '#F00'; // red
        break;
    case 'J':
        layout = [
            '###',
            '  #'
        ];
        colour = '#FF0'; // yellow
        break;
    case 'L':
        layout = [
            '###',
            '#  '
        ];
        colour = '#F0F'; // magenta
        break;
    case 'O':
        layout = [
            '##',
            '##'
        ];
        colour = '#00F'; // blue
        break;
    case 'S':
        layout = [
            ' ##',
            '## '
        ];
        colour = '#0FF'; // cyan
        break;
    case 'T':
        layout = [
            '###',
            ' # '
        ];
        colour = '#0F0'; // green
        break;
    case 'Z':
        layout = [
            '## ',
            ' ##'
        ];
        colour = '#F90'; // orange
        break;
    default:
        throw new Error('unknown shape: ' + shape);
    }

    this.tiles = [];
    var row, x, y;
    for (y = 0; y < layout.length; y++) {
        row = layout[y];
        for (x = 0; x < row.length; x++) {
            if (row[x] === '#') {
                this.tiles.push(new Tile(x, y, colour));
            }
        }
    }
    this.w = x;
    this.h = y;
}

Piece.prototype = {

    render: function (ctx) {
        ctx.save();
        ctx.translate(this.x * CELL_W, this.y * CELL_H);
        this.tiles.forEach(function (tile) {
            tile.render(ctx);
        });
        ctx.restore();
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

    render: function (ctx) {
        ctx.save();

        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, this.w * CELL_W, this.h * CELL_H);

        this.tiles.forEach(function (tile) {
            tile.render(ctx);
        });
        this.currentPiece.render(ctx);

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
                // FIXME
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
            grid.update(now - lastLoopTime);
        }
        if (!grid.full) {
            lastLoopTime = now;
            grid.render(ctx);
            window.setTimeout(loop, delay);
        }
    }

    window.setTimeout(loop, delay);
});

