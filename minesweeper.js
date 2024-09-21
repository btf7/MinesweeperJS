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

function forEachNeighbor(i, func) {
    toprow = i < 9;
    bottomrow = i > 71;
    leftcolumn = i % 9 == 0;
    rightcolumn = i % 9 == 8;

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

class Tile {
    constructor(tile) {
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
            }
        }
    }
}

// Create the tiles

const tiles = [];
tiles.length = 81;

for (let i = 0; i < 81; i++) {
    board.insertAdjacentHTML("beforeend", tileHTML);
    tiles[i] = new Tile(board.children[i]);

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
                tiles[i].reveal();
                if (rightmousedown) {
                    forEachNeighbor(i, function(j) {tiles[j].reveal();});
                }
            } else if (rightmousedown) {
                tiles[i].unhover();
                forEachNeighbor(i, function(j) {tiles[j].unhover();});
            } else if (e.button == 0) {
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

// Create 10 bombs

// Could just choose 10 random positions, repeating if there's already a bomb there,
// but this method could lag on large board where nearly every tile is a bomb.
// Therefore, create a list containing all tile indexes,
// randomise the order, then plant bombs on the 10 first elements

indexes = []
for (i = 0; i < 81; i++) {
    indexes[i] = i;
}
for (i = 0; i < 81; i++) {
    tmp = indexes[i];
    j = Math.round(Math.random() * 80);
    indexes[i] = indexes[j];
    indexes[j] = tmp;
}
for (i = 0; i < 10; i++) {
    tiles[indexes[i]].bomb = true;
    forEachNeighbor(indexes[i], function(j) {tiles[j].value++;});
}