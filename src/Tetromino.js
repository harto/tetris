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
        
        if (T.debug) {
            ctx.strokeStyle = '#000';
            ctx.strokeRect(0, 0, this.w * T.CELL_W, this.h * T.CELL_H);
        }
        
        this.tiles.forEach(function (tile) {
            tile.render(ctx);
        });
        ctx.restore();
    },

    rotate: function () {
        var axis = Vector.create([this.w / 2, this.h / 2]);
        this.tiles.forEach(function (tile) {
            var v = Vector.create([tile.x, tile.y]);
            v = v.rotate(-Math.PI / 2, axis);
            tile.x = v.e(1);//Math.floor(v.e(1));
            tile.y = v.e(2);//Math.floor(v.e(2));
        });

        // update dimensions
        this.w = Math.max.apply(null, this.tiles.map(function (tile) {
            return tile.x;
        })) + 1;
        this.h = Math.max.apply(null, this.tiles.map(function (tile) {
            return tile.y;
        })) + 1;
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