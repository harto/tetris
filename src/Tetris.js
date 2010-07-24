/*
 * Game entry point
 */

/*global $, window */

// define ns, globals
var T = {
    KEY_MAPPINGS: {
        PAUSE: 32,
        P1: {
            ROTATE: 38,
            DROP: 40,
            LEFT: 37,
            RIGHT: 39
        }
    },
    REFRESH_HZ: 12
};

$(function () {
    var canvas = $('canvas').get(0);

    var nRows = 20;
    var nCols = 10;

    T.CELL_W = canvas.width / nCols;
    T.CELL_H = canvas.height / nRows;

    T.field = new T.Field(nCols, nRows, T.KEY_MAPPINGS.P1);

    $(window).keydown(function (e) {
        if (e.which === T.KEY_MAPPINGS.PAUSE) {
            T.paused = !T.paused;
            e.preventDefault();
        }
        // per-field handlers
        if (T.field.handleKeydown(e.which)) {
            e.preventDefault();
        }
    });

    var looper;
    var lastLoop = new Date().getTime();
    var ctx = canvas.getContext('2d');

    function loop() {
        if (T.field.full) {
            // game over
            looper = null;
            return;
        }
        
        var now = new Date();
        if (!T.paused) {
            T.field.update(now - lastLoop);
        }
        lastLoop = now;
        
        T.field.render(ctx);
    }

    looper = window.setInterval(loop, 1000 / T.REFRESH_HZ);
});