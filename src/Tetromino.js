/*
 * A single piece.
 */

/*global T */

T.Tetromino = function (shape) {

    this.shape = shape;

    var colour, layout;

    switch (shape) {
    case 'I':
        layout = [
            '####'
        ];
        this.offsets = [];//[[-1, 0], [0, -1], [1, 0], [0, 1]];
        colour = '#F00'; // red
        break;
    case 'J':
        layout = [
            '###',
            '  #'
        ];
        this.offsets = [];
        colour = '#FF0'; // yellow
        break;
    case 'L':
        layout = [
            '###',
            '#  '
        ];
        //this.offsets = [[-1, 0], [-1, 0], [-1, 0], ];
        colour = '#F0F'; // magenta
        break;
    case 'O':
        layout = [
            '##',
            '##'
        ];
        this.offsets = [];
        colour = '#00F'; // blue
        break;
    case 'S':
        layout = [
            ' ##',
            '## '
        ];
        this.offsets = [[1, 0], [-1, -1]];
        colour = '#0FF'; // cyan
        break;
    case 'T':
        layout = [
            '###',
            ' # '
        ];
        this.offsets = [[1, -1], [-1, -1], [0, 0], [0, 0]];
        colour = '#0F0'; // green
        break;
    case 'Z':
        layout = [
            '## ',
            ' ##'
        ];
        this.offsets = [[1, 0], [-1, -1]];
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
                this.tiles.push(new T.Tile(x, y, colour));
            }
        }
    }
    this.w = x;
    this.h = y;
};

T.Tetromino.prototype = {

    render: function (ctx) {
        ctx.save();
        ctx.translate(this.x * T.CELL_W, this.y * T.CELL_H);
        
        this.tiles.forEach(function (tile) {
            tile.render(ctx);
        });

        if (T.debug) {
            // bounding box
            ctx.strokeStyle = '#000';
            ctx.strokeRect(0, 0, this.w * T.CELL_W, this.h * T.CELL_H);
        }
                
        ctx.restore();
    },

    rotate: function () {
        var offset = this.offsets.shift();
        if (offset) {
            // re-queue
            this.offsets.push(offset);
        }
        else {
            offset = [0, 0];
        }

        var angle = 3 * Math.PI / 2;
        var axis = Vector.create([Math.floor(this.w / 2), Math.floor(this.h / 2)]);

        this.tiles.forEach(function (tile) {
            var v = Vector.create([tile.x, tile.y]);
            v = v.rotate(angle, axis).round();
            tile.x = v.e(1) + offset[0];
            tile.y = v.e(2) + offset[1];
        });

        var xs = this.tiles.map(function (tile) { return tile.x; });
        var ys = this.tiles.map(function (tile) { return tile.y; });

        var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs),
            minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);

        console.log('minx=' + minX + ', miny=' + minY + ', maxX=' + maxX + ', maxY=' + maxY);

        // recalculate dimensions
        this.w = maxX - minX + 1;
        this.h = maxY - minY + 1;

        // relocate tiles within frame
        this.tiles.forEach(function (tile) {
            tile.x -= minX;
            tile.y -= minY;
        });
        this.x += minX;
        this.y += minY;
    },

    collidesWith: function (tile) {
        var thisX = this.x, thisY = this.y;
        return (
            // bounds check
            thisX <= tile.x && tile.x <= thisX + this.w &&
            thisY <= tile.y && tile.y <= thisY + this.h &&
            // per-tile check
            this.tiles.some(function (tile2) {
                return tile.x === thisX + tile2.x && tile.y === thisY + tile2.y;
            }));
    },

    toString: function () {
        return 'Tetromino[shape=' + this.shape + ',x=' + this.x + ',y=' + this.y +
            ',w=' + this.w + ',h=' + this.h + ']';
    }
};

T.Tetromino.random = function () {
    var shapes = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    return new T.Tetromino(shapes[Math.floor(Math.random() * shapes.length)]);
};
