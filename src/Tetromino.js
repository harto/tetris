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

T.Tetromino.prototype.render = function (ctx) {
    ctx.save();
    ctx.translate(this.x * T.CELL_W, this.y * T.CELL_H);
    for (var i in this.tiles) {
        this.tiles[i].render(ctx);
    }
    ctx.restore();
};

T.Tetromino.prototype.toString = function () {
    return 'Tetromino[shape=' + this.shape + ',x=' + this.x + ',y=' + this.y +
           ',w=' + this.w + ',h=' + this.h + ']';
};

T.Tetromino.archetypes = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'].map(function (shape) {
    return new T.Tetromino(shape);
});