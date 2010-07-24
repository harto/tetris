/*
 * The playing area.
 */

/*global T */

T.Field = function (w, h, keyMappings) {
    this.w = w;
    this.h = h;
    this.keyMappings = keyMappings;

    this.queue = [];

    // test
    this.idx = 0;
    this.fetchNext();
};

T.Field.prototype.render = function (ctx) {
    ctx.save();

    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, this.w * T.CELL_W, this.h * T.CELL_H);
    
    this.current.render(ctx);
    
    ctx.restore();
};

T.Field.prototype.move = function (o, dx, dy) {
    var x = o.x + dx;
    var y = o.y + dy;

    if (x < 0 || this.w < x + o.w || y < 0 || this.h < y + o.h) {
        return false;
    }

    o.x = x;
    o.y = y;
    return true;    
};

T.Field.prototype.fetchNext = function () {
    // FIXME
    this.current = T.Tetromino.archetypes[this.idx++ % T.Tetromino.archetypes.length];
    this.current.x = this.current.y = 2;
};

T.Field.prototype.handleKeydown = function (keyCode) {
    switch (keyCode) {
    case this.keyMappings.rotate:
        console.log('rotate');
        break;
    case this.keyMappings.drop:
        console.log('drop');
        this.fetchNext();
        break;
    case this.keyMappings.left:
        console.log('left');
        this.move(this.current, -1, 0);
        break;
    case this.keyMappings.right:
        console.log('right');
        this.move(this.current, 1, 0);
        break;
    default:
        return false;
    }
    return true;
};