/*
 * The playing area.
 */

/*global T */

T.Field = function (w, h, keyMappings) {
    this.w = w;
    this.h = h;
    this.keyMappings = keyMappings;

    this.msSinceLastStep = 0;

    this.queue = [
        T.Tetromino.random(),
        T.Tetromino.random(),
        T.Tetromino.random()
    ];
        
    this.tiles = [];
    this.current = this.fetchNext();
};

T.Field.prototype = {
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

        if (!this.move(this.current, 0, 1)) {
            this.land(this.current);
        }
        
        this.msSinceLastStep = 0;
    },

    validPosition: function (t) {
        return !(
            t.x < 0 || this.w < t.x + t.w ||
            t.y < 0 || this.h < t.y + t.h ||
            this.tiles.some(function (tile) {
                return t.collidesWith(tile);
            }));
    },

    move: function (t, dx, dy) {
        t.x += dx;
        t.y += dy;

        if (this.validPosition(t)) {
            return true;
        } else {
            t.x -= dx;
            t.y -= dy;
            return false;
        }
    },

    fetchNext: function () {
        var next = this.queue.shift();
        this.queue.push(T.Tetromino.random());
        next.x = Math.floor((this.w - next.w) / 2);
        next.y = 0;
        if (this.validPosition(next)) {
            return next;
        } else {
            this.full = true;
            return null;
        }
    },

    drop: function (t) {
        while (this.move(t, 0, 1)) {
            // keep going
        }
        this.land(t);
    },

    land: function (t) {
        // consume tiles
        var tiles = this.tiles;
        t.tiles.forEach(function (tile) {
            tiles.push(tile);
            tile.x += t.x;
            tile.y += t.y;
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

    handleKeydown: function (keyCode) {
        switch (keyCode) {
        case this.keyMappings.ROTATE:
            //console.log('rotate');
            break;
        case this.keyMappings.DROP:
            //console.log('drop');
            this.drop(this.current);
            break;
        case this.keyMappings.LEFT:
            //console.log('left');
            this.move(this.current, -1, 0);
            break;
        case this.keyMappings.RIGHT:
            //console.log('right');
            this.move(this.current, 1, 0);
            break;
        default:
            return false;
        }
        return true;
    }
};