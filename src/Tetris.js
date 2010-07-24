/*
 * Game entry point
 */

/*global $, window */

// define ns
var T = {
    KEY_MAPPINGS: {
        rotate: 38,
        drop: 40,
        left: 37,
        right: 39
    },
    REFRESH_HZ: 12
};

$(function () {
    var canvas = $('canvas').get(0);

    var nRows = 20;
    var nCols = 10;

    T.CELL_W = canvas.width / nCols;
    T.CELL_H = canvas.height / nRows;

    T.field = new T.Field(nCols, nRows, T.KEY_MAPPINGS);

    var ctx = canvas.getContext('2d');
    function render() {
        T.field.render(ctx);
    }

    $(window).keydown(function (e) {
        if (T.field.handleKeydown(e.which)) {
            e.preventDefault();
        }
    });

    var renderLoop = window.setInterval(render, 1000 / T.REFRESH_HZ);
});