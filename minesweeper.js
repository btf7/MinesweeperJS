const board = document.getElementById("tileBoard");
const tileHTML = '<img src="imgs/hidden.gif" alt="tile" width="32" height="32" draggable="false" (dragstart)="false;">';
var leftmousedown = false;
var rightmousedown = false;
var gameStarted = false;
const mineCount = 10;
const tiles = [];
tiles.length = 81;

document.onmouseup = function(e) {
    if (e.button == 0 || e.button == 2) {
        leftmousedown = false;
        rightmousedown = false;
    }
}

// Calls func(j) for each j where tiles[j] is a neighbor of tiles[i]
function forEachNeighbor(i, func) {
    const toprow = i < 9;
    const bottomrow = i > 71;
    const leftcolumn = i % 9 == 0;
    const rightcolumn = i % 9 == 8;

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
    // Can't use forEachNeighbor() as we also have to splice the centre tile, and order matters
    const toprow = startI < 9;
    const bottomrow = startI > 71;
    const leftcolumn = startI % 9 == 0;
    const rightcolumn = startI % 9 == 8;

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
    // Only have to randomise first (mineCount) elements
    for (i = 0; i < mineCount; i++) {
        const tmp = indexes[i];
        const j = Math.round(Math.random() * (indexes.length - 1));
        indexes[i] = indexes[j];
        indexes[j] = tmp;
    }

    // Create bombs
    for (i = 0; i < mineCount; i++) {
        tiles[indexes[i]].bomb = true;
        forEachNeighbor(indexes[i], function(j) {tiles[j].value++;});
    }
}

class Tile {
    constructor(i, tile) {
        this.index = i;
        this.hidden = true;
        this.flagged = false;
        this._tile = tile // The HTML <img> object
        this.value = 0;
        this.bomb = false;
    }

    _canReveal() {
        return this.hidden && !this.flagged;
    }

    flag() {
        if (this.hidden) {
            if (this.flagged) {
                this._tile.src = "imgs/hidden.gif";
            } else {
                this._tile.src = "imgs/flag.gif";
            }
            this.flagged = !this.flagged;
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

// Create the tiles
for (let i = 0; i < 81; i++) {
    board.insertAdjacentHTML("beforeend", tileHTML);
    tiles[i] = new Tile(i, board.children[i]);

    board.children[i].onmousedown = function(event) {
        if (event.button == 0) {
            leftmousedown = true;
            tiles[i].hover();
            if (rightmousedown) {
                forEachNeighbor(i, function(j) {tiles[j].hover();});
            }
        } else if (event.button == 2) {
            rightmousedown = true;
            if (leftmousedown) {
                forEachNeighbor(i, function(j) {tiles[j].hover();});
            } else {
                tiles[i].flag();
            }
        }
    }

    board.children[i].onmouseup = function(event) {
        if (leftmousedown && (event.button == 0 || event.button == 2)) {
            if (rightmousedown) {
                // You can only reveal a 3x3 area if the
                // number of flags around the tile is correct
                let flags = 0;
                forEachNeighbor(i, function(j) {if (tiles[j].flagged) {flags++;}});

                if (!tiles[i].hidden && flags == tiles[i].value) {
                    forEachNeighbor(i, function(j) {tiles[j].reveal();});
                } else {
                    tiles[i].unhover();
                    forEachNeighbor(i, function(j) {tiles[j].unhover();});
                }
            } else if (event.button == 0) {
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

    board.children[i].onmouseenter = function(event) {
        if (leftmousedown) {
            tiles[i].hover();
            if (rightmousedown) {
                forEachNeighbor(i, function(j) {tiles[j].hover();});
            }
        }
    }

    board.children[i].onmouseleave = function(event) {
        if (leftmousedown) {
            tiles[i].unhover();
            if (rightmousedown) {
                forEachNeighbor(i, function(j) {tiles[j].unhover();});
            }
        }
    }
}