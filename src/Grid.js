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

        if (!this.move(0, 1)) {
            this.land();
        }
        
        this.msSinceLastStep = 0;
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

    // attempt move and return flag indicating move validity
    move: function (dx, dy) {
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

    fetchNext: function () {
        var next = this.queue.shift();
        this.queue.push(T.Tetromino.random());
        
        next.x = Math.floor((this.w - next.w) / 2);
        next.y = 0;
        
        if (this.valid(next)) {
            return next;
        } else {
            this.full = true;
            // prevent rendering in invalid position
            return null;
        }
    },

    drop: function () {
        while (this.move(0, 1)) {
            // to the bottom
        }
        this.land();
    },

    land: function () {
        var current = this.current;
        // consume tiles
        var tiles = this.tiles;
        current.tiles.forEach(function (tile) {
            tiles.push(tile);
            tile.x += current.x;
            tile.y += current.y;
        });

        // find full rows
        var tileCounts = [];
        var nMaxRowTiles = this.w;
        var eliminatedRowIds = [];
        tiles.forEach(function (tile) {
            var rowId = tile.y;
            tileCounts[rowId] = (tileCounts[rowId] || 0) + 1;
            if (tileCounts[rowId] === nMaxRowTiles) {
                eliminatedRowIds.push(rowId);
            }
        });
        
        // remove eliminated tiles
        eliminatedRowIds.forEach(function (rowId) {
            tiles = tiles.filter(function (tile) {
                return tile.y !== rowId;
            });
        });
        this.tiles = tiles;
        
        // compact remaining tiles
        eliminatedRowIds.sort(function (a, b) {
            return a - b;
        });
        eliminatedRowIds.forEach(function (rowId) {
            tiles.forEach(function (tile) {
                if (tile.y < rowId) {
                    tile.y++;
                }
            });
        });

        this.current = this.fetchNext();
    },
};