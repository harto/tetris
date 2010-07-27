/*
 * The game entry point.
 */

/*global $, window */

// define ns, globals
var T = {
    keys: {
        pause: 32,
        game: {
            rotate: 38,
            drop: 40,
            left: 37,
            right: 39        
        }
    },
    refreshHz: 12
};

$(function () {
    var canvas = $('canvas').get(0);
    var ctx = canvas.getContext('2d');

    var nRows = 20;
    var nCols = 10;

    T.CELL_W = canvas.width / nCols;
    T.CELL_H = canvas.height / nRows;

    T.grid = new T.Grid(nCols, nRows);

    // build an index of relevant keycodes so we know when
    // to prevent the default action
    var gameKeycodes = {};
    for (var i in T.keys.game) {
        gameKeycodes[T.keys.game[i]] = true;
    }

    var commandQueue = [];

    $(window).keydown(function (e) {
        var keycode = e.which;

        if (keycode === T.keys.pause) {
            // execute immediately
            T.paused = !T.paused;
            console.log('paused=' + T.paused);
            e.preventDefault();
        } else if (!T.paused && gameKeycodes[keycode]) {
            // save game-level commands for later
            commandQueue.push(keycode);
            e.preventDefault();
        }
    });

    function executeCommand(keycode) {
        var keys = T.keys.game;
        switch (keycode) {
        case keys.rotate:
            //console.log('rotate');
            break;
        case keys.drop:
            //console.log('drop');
            T.grid.drop();
            break;
        case keys.left:
            //console.log('left');
            T.grid.move(-1, 0);
            break;
        case keys.right:
            //console.log('right');
            T.grid.move(1, 0);
            break;
        default:
            throw new Error('unmapped keycode: ' + keycode);
        }
    }

    var timer;
    var delay = 1000 / T.refreshHz;
    var lastLoopTime = new Date().getTime();

    function loop() {
        var now = new Date();
        if (!T.paused) {
            var keycode;
            while ((keycode = commandQueue.shift())) {
                executeCommand(keycode);
            }
            T.grid.update(now - lastLoopTime);
        }
        lastLoopTime = now;
        
        T.grid.render(ctx);
        
        if (T.grid.full) {
            // game over
            return;
        } else {
            timer = window.setTimeout(loop, delay);
        }
    }

    timer = window.setTimeout(loop, delay);
});