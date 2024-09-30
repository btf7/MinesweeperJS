const board = document.getElementById("tileBoard");
const mineCountHundreds = document.getElementById("minehundreds");
const mineCountTens = document.getElementById("minetens");
const mineCountOnes = document.getElementById("mineones");
const button = document.getElementById("resetbutton");
const tileHTML = '<img src="imgs/hidden.gif" alt="tile" width="32" height="32" draggable="false" (dragstart)="false;">';

// Why does JS not have enums??
const gameNotStarted = 0;
const gamePlaying = 1;
const gameWon = 2;
const gameLost = 3;

var leftMouseDown = false;
var rightMouseDown = false;
var buttonMouseDown = false;
var gameState = gameNotStarted;
const mineCount = 10;
var flagCount = 0;
var hiddenTilesRemaining = 71;
const tiles = [];
tiles.length = 81;

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

function updateMineCount() {
    let remainingMines = mineCount - flagCount;
    if (remainingMines < 0) {
        mineCountHundreds.src = "imgs/number-.gif";
    } else {
        mineCountHundreds.src = "imgs/number" + Math.floor(remainingMines / 100) % 10 + ".gif";
    }
    mineCountTens.src = "imgs/number" + Math.floor(Math.abs(remainingMines) / 10 % 10) + ".gif";
    mineCountOnes.src = "imgs/number" + Math.abs(remainingMines) % 10 + ".gif";
}

function setButtonImage() {
    if (gameState == gameLost) {
        button.src = "imgs/button-fail.gif";
    } else if (gameState == gameWon) {
        button.src = "imgs/button-victory.gif";
    } else {
        button.src = "imgs/button-normal.gif";
    }
}

function setButtonPressedImage() {
    if (gameState == gameLost) {
        button.src = "imgs/button-fail-pressed.gif";
    } else if (gameState == gameWon) {
        button.src = "imgs/button-victory-pressed.gif";
    } else {
        button.src = "imgs/button-normal-pressed.gif";
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

    reset() {
        this.hidden = true;
        this.flagged = false;
        this._tile.src = "imgs/hidden.gif";
        this.value = 0;
        this.bomb = false;
    }

    _canReveal() {
        return this.hidden && !this.flagged;
    }

    flag() {
        if (this.hidden) {
            if (this.flagged) {
                this._tile.src = "imgs/hidden.gif"
                flagCount--;
            } else {
                this._tile.src = "imgs/flag.gif";
                flagCount++;
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
                gameState = gameLost;
            } else {
                this._tile.src = "imgs/" + this.value + ".gif";
                if (this.value == 0) {
                    forEachNeighbor(this.index, function(j) {tiles[j].reveal();});
                }
                // 3x3 reveal could result in a move where we reveal a bomb, but also reveal the correct number of tiles to win
                // Therefore you must check if we have lost before declaring a victory
                if (--hiddenTilesRemaining == 0 && gameState != gameLost) {
                    gameState = gameWon;
                }
            }
        }
    }

    revealBomb() {
        if (this.bomb) {
            if (this.hidden && !this.flagged) {
                this._tile.src = "imgs/bomb.gif";
            }
        } else if (this.flagged) {
            this._tile.src = "imgs/flag-wrong.gif";
        }
    }

    showFlag() {
        if (this.bomb) {
            this._tile.src = "imgs/flag.gif";
        }
    }
}

document.onmouseup = function(event) {
    if (event.button == 0 || event.button == 2) {
        setButtonImage();
        leftMouseDown = false;
        rightMouseDown = false;
        buttonMouseDown = false;
    }
}

button.onmousedown = function(event) {
    if (event.button == 0) {
        buttonMouseDown = true;
        setButtonPressedImage();
    }
}

button.onmouseenter = function(event) {
    if (buttonMouseDown) {
        setButtonPressedImage();
    }
}

button.onmouseleave = function(event) {
    if (buttonMouseDown) {
        setButtonImage();
    }
}

button.onmouseup = function(event) {
    if (buttonMouseDown && event.button == 0) {
        // Reset the board
        for (let i = 0; i < 81; i++) {
            tiles[i].reset();
        }
        gameState = gameNotStarted;
        flagCount = 0;
        hiddenTilesRemaining = 71;
        updateMineCount();
    }
}

// Create the tiles
for (let i = 0; i < 81; i++) {
    board.insertAdjacentHTML("beforeend", tileHTML);
    tiles[i] = new Tile(i, board.children[i]);

    board.children[i].onmousedown = function(event) {
        if (gameState == gameWon || gameState == gameLost) {
            return;
        }

        if (event.button == 0) {
            leftMouseDown = true;
            button.src = "imgs/button-warn.gif";
            tiles[i].hover();
            if (rightMouseDown) {
                forEachNeighbor(i, function(j) {tiles[j].hover();});
            }
        } else if (event.button == 2) {
            rightMouseDown = true;
            if (leftMouseDown) {
                forEachNeighbor(i, function(j) {tiles[j].hover();});
            } else {
                tiles[i].flag();
                updateMineCount();
            }
        }
    }

    board.children[i].onmouseup = function(event) {
        if (gameState == gameWon || gameState == gameLost) {
            return;
        }

        if (leftMouseDown && (event.button == 0 || event.button == 2)) {
            if (rightMouseDown) {
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
                if (gameState == gameNotStarted) {
                    gameState = gamePlaying;
                    createBombs(i);
                }
                tiles[i].reveal();
            }
            if (gameState == gameLost) {
                for (let i = 0; i < 81; i++) {
                    tiles[i].revealBomb();
                }
            } else if (gameState == gameWon) {
                for (let i = 0; i < 81; i++) {
                    tiles[i].showFlag();
                    flagCount = mineCount;
                }
            }
        }
    }

    board.children[i].onmouseenter = function(event) {
        if (leftMouseDown) {
            tiles[i].hover();
            if (rightMouseDown) {
                forEachNeighbor(i, function(j) {tiles[j].hover();});
            }
        }
    }

    board.children[i].onmouseleave = function(event) {
        if (leftMouseDown) {
            tiles[i].unhover();
            if (rightMouseDown) {
                forEachNeighbor(i, function(j) {tiles[j].unhover();});
            }
        }
    }
}

updateMineCount();