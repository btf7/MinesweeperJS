const board = document.getElementById("tileBoard");
const tileHTML = '<img src="imgs/hidden.gif" alt="tile" width="32" height="32" draggable="false" (dragstart)="false;">';
var leftmousedown = false;
var rightmousedown = false;

document.onmouseup = function(e) {
    if (e.button == 0 || e.button == 2) {
        leftmousedown = false;
        rightmousedown = false;
    }
}

// Calls func(j) for each j where tiles[j] is a neighbor of tiles[i]
function forEachNeighbor(i, func) {
    let toprow = i < 9;
    let bottomrow = i > 71;
    let leftcolumn = i % 9 == 0;
    let rightcolumn = i % 9 == 8;
    if (!toprow) {
        if (!leftcolumn) {func(i-10);}
        func(i-9);
        if (!rightcolumn) {func(i-8);}
    }
    if (!leftcolumn) {func(i-1);}
    if (!rightcolumn) {func(i+1);}
    if (!bottomrow) {
        if (!leftcolumn) {func(i+8);}
        func(i+9);
        if (!rightcolumn) {func(i+10);}
    }
}

function createBombs(startI) {
    // Create 10 bombs

    // Could just choose 10 random positions, repeating if there's already a bomb there,
    // but this method could lag on large board where nearly every tile is a bomb.
    // Therefore, create a list containing all tile indexes,
    // randomise the order, then plant bombs on the 10 first elements

    const indexes = []
    for (i = 0; i < 81; i++) {
        indexes[i] = i;
    }

    // Remove tiles around start tile
    let toprow = startI < 9;
    let bottomrow = startI > 71;
    let leftcolumn = startI % 9 == 0;
    let rightcolumn = startI % 9 == 8;

    if (!bottomrow) {
        if (!rightcolumn) {indexes.splice(startI+10, 1);}
        indexes.splice(startI+9, 1);
        if (!leftcolumn) {indexes.splice(startI+8, 1);}
    }
    if (!rightcolumn) {indexes.splice(startI+1, 1);}
    indexes.splice(startI, 1);
    if (!leftcolumn) {indexes.splice(startI-1, 1);}
    if (!toprow) {
        if (!rightcolumn) {indexes.splice(startI-8, 1);}
        indexes.splice(startI-9, 1);
        if (!leftcolumn) {indexes.splice(startI-10, 1);}
    }

    // Randomise
    for (i = 0; i < indexes.length; i++) {
        let tmp = indexes[i];
        let j = Math.round(Math.random() * (indexes.length - 1));
        indexes[i] = indexes[j];
        indexes[j] = tmp;
    }

    // Create bombs
    for (i = 0; i < 10; i++) {
        tiles[indexes[i]].bomb = true;
        forEachNeighbor(indexes[i], function(j) {tiles[j].value++;});
    }
}

class Tile {
    constructor(i, tile) {
        this.index = i;
        this.hidden = true;
        this._flagged = false;
        this._tile = tile // The HTML <img> object
        this.value = 0;
        this.bomb = false;
    }

    _canReveal() {
        return this.hidden && !this._flagged;
    }

    flag() {
        if (this.hidden) {
            if (this._flagged) {
                this._tile.src = "imgs/hidden.gif";
            } else {
                this._tile.src = "imgs/flag.gif";
            }
            this._flagged = !this._flagged;
        }
    }

    hover() {
        if (this._canReveal()) {
            this._tile.src = "imgs/0.gif";
        }
    }

    unhover() {
        if (this._canReveal()) {
            this._tile.src = "imgs/hidden.gif";
        }
    }

    reveal() {
        if (this._canReveal()) {
            this.hidden = false;
            if (this.bomb) {
                this._tile.src = "imgs/bomb-clicked.gif";
            } else {
                this._tile.src = "imgs/" + this.value + ".gif";
                if (this.value == 0) {
                    forEachNeighbor(this.index, function(j) {tiles[j].reveal();});
                }
            }
        }
    }
}

var gameStarted = false;

// Create the tiles

const tiles = [];
tiles.length = 81;

for (let i = 0; i < 81; i++) {
    board.insertAdjacentHTML("beforeend", tileHTML);
    tiles[i] = new Tile(i, board.children[i]);

    board.children[i].onmousedown = function(e) {
        if (e.button == 0) {
            leftmousedown = true;
            tiles[i].hover();
            if (rightmousedown) {
                forEachNeighbor(i, function(j) {tiles[j].hover();});
            }
        } else if (e.button == 2) {
            rightmousedown = true;
            if (leftmousedown) {
                forEachNeighbor(i, function(j) {tiles[j].hover();});
            } else {
                tiles[i].flag();
            }
        }
    }

    board.children[i].onmouseup = function(e) {
        if (leftmousedown && (e.button == 0 || (e.button == 2 && rightmousedown))) {
            if (!tiles[i].hidden) {
                if (rightmousedown) {
                    forEachNeighbor(i, function(j) {tiles[j].reveal();});
                }
            } else if (rightmousedown) {
                tiles[i].unhover();
                forEachNeighbor(i, function(j) {tiles[j].unhover();});
            } else if (e.button == 0) {
                if (!gameStarted) {
                    gameStarted = true;
                    createBombs(i);
                }
                tiles[i].reveal();
            }
            leftmousedown = false;
            rightmousedown = false;
        }
    }

    board.children[i].onmouseenter = function(e) {
        if (leftmousedown) {
            tiles[i].hover();
            if (rightmousedown) {
                forEachNeighbor(i, function(j) {tiles[j].hover();});
            }
        }
    }

    board.children[i].onmouseleave = function(e) {
        if (leftmousedown) {
            tiles[i].unhover();
            if (rightmousedown) {
                forEachNeighbor(i, function(j) {tiles[j].unhover();});
            }
        }
    }
}