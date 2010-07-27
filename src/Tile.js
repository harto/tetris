/*
 * An individual tile. Tiles make up a tetronimos and fill the grid.
 */

/*global T */

T.Tile = function (x, y, colour) {
    this.x = x;
    this.y = y;
    this.colour = colour;
};

T.Tile.prototype = {
    
    render: function (ctx) {
        ctx.save();

        ctx.fillStyle = this.colour;
        ctx.fillRect(this.x * T.CELL_W, this.y * T.CELL_H, T.CELL_W, T.CELL_H);

        ctx.restore();
    },

    toString: function () {
        return 'Tile[x=' + this.x + ',y=' + this.y + ',colour=' + this.colour + ']';
    }
};

