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

const tiles = [];
tiles.length = 81;

class Tile {
    constructor(tile) {
        this.hidden = true;
        this._flagged = false;
        this._tile = tile // The HTML <img> object
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
            this._tile.src = "imgs/1.gif";
        }
    }
}

function hoverNeighbors(i) {
    toprow = i < 9;
    bottomrow = i > 71;
    leftcolumn = i % 9 == 0;
    rightcolumn = i % 9 == 8;

    if (!toprow) {
        if (!leftcolumn) {tiles[i-10].hover();}
        tiles[i-9].hover();
        if (!rightcolumn) {tiles[i-8].hover();}
    }
    if (!leftcolumn) {tiles[i-1].hover();}
    if (!rightcolumn) {tiles[i+1].hover();}
    if (!bottomrow) {
        if (!leftcolumn) {tiles[i+8].hover();}
        tiles[i+9].hover();
        if (!rightcolumn) {tiles[i+10].hover();}
    }
}

function unhoverNeighbors(i) {
    toprow = i < 9;
    bottomrow = i > 71;
    leftcolumn = i % 9 == 0;
    rightcolumn = i % 9 == 8;

    if (!toprow) {
        if (!leftcolumn) {tiles[i-10].unhover();}
        tiles[i-9].unhover();
        if (!rightcolumn) {tiles[i-8].unhover();}
    }
    if (!leftcolumn) {tiles[i-1].unhover();}
    if (!rightcolumn) {tiles[i+1].unhover();}
    if (!bottomrow) {
        if (!leftcolumn) {tiles[i+8].unhover();}
        tiles[i+9].unhover();
        if (!rightcolumn) {tiles[i+10].unhover();}
    }
}

function revealNeighbors(i) {
    toprow = i < 9;
    bottomrow = i > 71;
    leftcolumn = i % 9 == 0;
    rightcolumn = i % 9 == 8;

    if (!toprow) {
        if (!leftcolumn) {tiles[i-10].reveal();}
        tiles[i-9].reveal();
        if (!rightcolumn) {tiles[i-8].reveal();}
    }
    if (!leftcolumn) {tiles[i-1].reveal();}
    if (!rightcolumn) {tiles[i+1].reveal();}
    if (!bottomrow) {
        if (!leftcolumn) {tiles[i+8].reveal();}
        tiles[i+9].reveal();
        if (!rightcolumn) {tiles[i+10].reveal();}
    }
}

for (let i = 0; i < 81; i++) {
    board.innerHTML += tileHTML;
}

for (let i = 0; i < 81; i++) {
    tiles[i] = new Tile(board.children[i]);

    board.children[i].onmousedown = function(e) {
        if (e.button == 0) {
            leftmousedown = true;
            tiles[i].hover();
            if (rightmousedown) {
                hoverNeighbors(i);
            }
        } else if (e.button == 2) {
            rightmousedown = true;
            if (leftmousedown) {
                hoverNeighbors(i);
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
                    revealNeighbors(i);
                }
            } else if (rightmousedown) {
                tiles[i].unhover();
                unhoverNeighbors(i);
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
                hoverNeighbors(i);
            }
        }
    }
    board.children[i].onmouseleave = function(e) {
        if (leftmousedown) {
            tiles[i].unhover();
            if (rightmousedown) {
                unhoverNeighbors(i);
            }
        }
    }
}