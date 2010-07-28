/*
 * The playing area.
 */

/*global T */

T.Grid = function (w, h, keyMappings) {
    this.w = w;
    this.h = h;

    this.msSinceLastStep = 0;

    this.queue = [
        T.Tetromino.random(),
        T.Tetromino.random(),
        T.Tetromino.random()
    ];
        
    this.tiles = [];
    this.current = this.fetchNext();
};

T.Grid.prototype = {
    
    render: function (ctx) {
        ctx.save();

        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, this.w * T.CELL_W, this.h * T.CELL_H);

        if (T.debug) {
            // draw gridlines
            function drawGridLine(x1, y1, x2, y2) {
                ctx.beginPath();
                ctx.moveTo(x1 * T.CELL_W, y1 * T.CELL_H);
                ctx.lineTo(x2 * T.CELL_W, y2 * T.CELL_H);
                ctx.stroke();
                
            }
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 0.5;
            for (var x = 1; x < this.w; x++) {
                drawGridLine(x, 0, x, this.h);
            }
            for (var y = 1; y < this.h; y++) {
                drawGridLine(0, y, this.w, y);
            }
        }

        this.tiles.forEach(function (tile) {
            tile.render(ctx);
        });
        this.current.render(ctx);
        
        ctx.restore();
    },

    update: function (delta) {
        this.msSinceLastStep += delta;
        if (this.msSinceLastStep < 500) {
            return;
        }

        if (!this.moveCurrent(0, 1)) {
            this.landCurrent();
        }
        
        this.msSinceLastStep = 0;
    },

    fetchNext: function () {
        var next = this.queue.shift();
        this.queue.push(T.Tetromino.random());
        
        next.x = Math.floor((this.w - next.w) / 2);
        next.y = 2; // FIXME
        
        if (this.valid(next)) {
            return next;
        } else {
            this.full = true;
            // prevent rendering in invalid position
            return null;
        }
    },

    // check that a piece is in a valid position
    valid: function (tetro) {
        return !(
            tetro.x < 0 || this.w < tetro.x + tetro.w ||
            tetro.y < 0 || this.h < tetro.y + tetro.h ||
            this.tiles.some(function (tile) {
                return tetro.collidesWith(tile);
            }));
    },

    rotateCurrent: function () {
        this.current.rotate();
    },

    // attempt move and return flag indicating move validity
    moveCurrent: function (dx, dy) {
        var current = this.current;

        current.x += dx;
        current.y += dy;

        if (this.valid(current)) {
            return true;
        } else {
            current.x -= dx;
            current.y -= dy;
            return false;
        }
    },

    dropCurrent: function () {
        while (this.moveCurrent(0, 1)) {
            // to the bottom
        }
        this.landCurrent();
    },

    landCurrent: function () {
        var current = this.current;

        // consume tiles
        var tiles = this.tiles;
        current.tiles.forEach(function (tile) {
            tiles.push(tile);
            tile.x += current.x;
            tile.y += current.y;
        });

        // organise into rows
        var rows = [];
        tiles.forEach(function (tile) {
            var rowId = tile.y;
            var row = rows[rowId] || [];
            row.push(tile);
            rows[rowId] = row;
        });

        // eliminate full rows
        rows.reverse();
        tiles = [];
        var nEliminated = 0;
        var nMaxRowTiles = this.w;
        rows.forEach(function (row) {
            if (row.length === nMaxRowTiles) {
                nEliminated++;
            } else {
                row.forEach(function (tile) {
                    // shift tiles downwards
                    tile.y += nEliminated;
                    // re-add to master collection
                    tiles.push(tile);
                });
            }
        });

        this.tiles = tiles;
        this.current = this.fetchNext();
    }
};