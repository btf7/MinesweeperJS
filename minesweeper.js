const game = document.getElementById("game");
const board = document.getElementById("tileBoard");
const button = document.getElementById("resetbutton");
const tileHTML = '<img src="imgs/hidden.gif" alt="tile" draggable="false" (dragstart)="false;">';
var tileSize = 32;

const mineCountHundreds = document.getElementById("minehundreds");
const mineCountTens = document.getElementById("minetens");
const mineCountOnes = document.getElementById("mineones");

const timerHundreds = document.getElementById("timerhundreds");
const timerTens = document.getElementById("timertens");
const timerOnes = document.getElementById("timerones");

const widthInput = document.getElementById("widthinput");
const heightInput = document.getElementById("heightinput");
const minesInput = document.getElementById("minesinput");

const scaleInput = document.getElementById("scaleinput");

// Why does JS not have enums??
const gameNotStarted = 0;
const gamePlaying = 1;
const gameWon = 2;
const gameLost = 3;

var leftMouseDown = false;
var rightMouseDown = false;
var buttonMouseDown = false;
var gameState = gameNotStarted;
var width = 9;
var height = 9;
board.style = "grid-template-columns: repeat(" + width + ", auto); grid-template-rows: repeat(" + height + ", auto);";
var mineCount = 10;
var flagCount = 0;
var time = 0;
var timerInterval = null;
const tiles = [];
tiles.length = width * height;
var hiddenTilesRemaining = tiles.length - mineCount;

// Calls func(j) for each j where tiles[j] is a neighbor of tiles[i]
function forEachNeighbor(i, func, includeCentre = false) {
    const toprow = i < width;
    const bottomrow = i >= tiles.length - width;
    const leftcolumn = i % width == 0;
    const rightcolumn = i % width == width - 1;

    // Order is important here as this is used for array splicing
    if (!bottomrow) {
        if (!rightcolumn) {func(i+width+1);}
        func(i+width);
        if (!leftcolumn) {func(i+width-1);}
    }
    if (!rightcolumn) {func(i+1);}
    if (includeCentre) {func(i);}
    if (!leftcolumn) {func(i-1);}
    if (!toprow) {
        if (!rightcolumn) {func(i-width+1);}
        func(i-width);
        if (!leftcolumn) {func(i-width-1);}
    }
}

function createBombs(startI) {
    // Create (mineCount) bombs

    // Could just choose (mineCount) random positions, repeating if there's already a bomb there,
    // but this method could lag on large board where nearly every tile is a bomb.
    // Therefore, create a list containing all available tile indexes,
    // then pop (mineCount) elements at random, where tiles[elem] will become a bomb

    const indexes = []
    indexes.length = tiles.length
    for (i = 0; i < indexes.length; i++) {
        indexes[i] = i;
    }

    // Remove tiles around start tile
    // If there are so many mines that not all surrounding tiles can be clear, only clear the start tile

    // First check if we are in a corner (3 surrounding tiles), edge (5 surrounding tiles) or middle (8 surrounding tiles)
    let edges = 0;
    if (startI < width) {edges++;}
    if (startI >= tiles.length - width) {edges++;}
    if (startI % width == 0) {edges++;}
    if (startI % width == width - 1) {edges++;}
    const cannotClear = (mineCount > tiles.length - 4) || (edges < 2 && mineCount > tiles.length - 6) || (edges == 0 && mineCount > tiles.length - 9);

    if (cannotClear) {
        indexes.splice(startI, 1);
    } else {
        forEachNeighbor(startI, function(j) {indexes.splice(j, 1);}, true);
    }

    // Create bombs
    for (i = 0; i < mineCount; i++) {
        const j = indexes.splice(Math.floor(Math.random() * indexes.length), 1)[0];
        tiles[j].bomb = true;
        forEachNeighbor(j, function(k) {tiles[k].value++;});
    }
}

function updateMineCount() {
    const remainingMines = mineCount - flagCount;
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

function updateTimer() {
    time++;
    timerHundreds.src = "imgs/number" + Math.floor(time / 100) % 10 + ".gif";
    timerTens.src = "imgs/number" + Math.floor(time / 10) % 10 + ".gif";
    timerOnes.src = "imgs/number" + time % 10 + ".gif";
}

class Tile {
    constructor(i, tile) {
        this.index = i;
        this.hidden = true;
        this.flagged = false;
        this.tile = tile // The HTML <img> object
        this.value = 0;
        this.bomb = false;
    }

    reset() {
        this.hidden = true;
        this.flagged = false;
        this.tile.src = "imgs/hidden.gif";
        this.value = 0;
        this.bomb = false;
    }

    _canReveal() {
        return this.hidden && !this.flagged;
    }

    flag() {
        if (this.hidden) {
            if (this.flagged) {
                this.tile.src = "imgs/hidden.gif"
                flagCount--;
            } else {
                this.tile.src = "imgs/flag.gif";
                flagCount++;
            }
            this.flagged = !this.flagged;
        }
    }

    hover() {
        if (this._canReveal()) {
            this.tile.src = "imgs/0.gif";
        }
    }

    unhover() {
        if (this._canReveal()) {
            this.tile.src = "imgs/hidden.gif";
        }
    }

    reveal() {
        if (this._canReveal()) {
            this.hidden = false;
            if (this.bomb) {
                this.tile.src = "imgs/bomb-clicked.gif";
                gameState = gameLost;
            } else {
                this.tile.src = "imgs/" + this.value + ".gif";
                if (this.value == 0) {
                    forEachNeighbor(this.index, function(j) {tiles[j].reveal();});
                }
                // 3x3 reveal could result in a move where we reveal a bomb, but also reveal the correct number of tiles to win
                // Therefore we must check if we have lost before declaring a victory
                if (--hiddenTilesRemaining == 0 && gameState != gameLost) {
                    gameState = gameWon;
                }
            }
        }
    }

    revealBomb() {
        if (this.bomb) {
            if (this.hidden && !this.flagged) {
                this.tile.src = "imgs/bomb.gif";
            }
        } else if (this.flagged) {
            this.tile.src = "imgs/flag-wrong.gif";
        }
    }

    showFlag() {
        if (this.bomb) {
            this.tile.src = "imgs/flag.gif";
        }
    }
}

function createTile(i) {
    board.insertAdjacentHTML("beforeend", tileHTML);
    board.children[i].style.width = tileSize + "px";
    board.children[i].style.height = tileSize + "px";
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
                    forEachNeighbor(i, function(j) {tiles[j].unhover();}, true);
                }
            } else if (event.button == 0) {
                if (gameState == gameNotStarted) {
                    gameState = gamePlaying;
                    createBombs(i);
                    timerInterval = setInterval(updateTimer, 1000);
                }
                tiles[i].reveal();
            }
            if (gameState == gameLost) {
                clearInterval(timerInterval);
                timerInterval = null;
                for (let i = 0; i < tiles.length; i++) {
                    tiles[i].revealBomb();
                }
            } else if (gameState == gameWon) {
                clearInterval(timerInterval);
                timerInterval = null;
                for (let i = 0; i < tiles.length; i++) {
                    tiles[i].showFlag();
                    flagCount = mineCount;
                    updateMineCount();
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
        // Check the size inputs
        if (isNaN(widthInput.valueAsNumber) || widthInput.valueAsNumber < 8) {
            widthInput.value = 8;
        }
        width = widthInput.valueAsNumber;

        if (isNaN(heightInput.valueAsNumber) || heightInput.valueAsNumber < 1) {
            heightInput.value = 1;
        }
        height = heightInput.valueAsNumber;

        if (isNaN(minesInput.valueAsNumber) || minesInput.valueAsNumber < 1) {
            minesInput.value = 1;
        } else if (minesInput.valueAsNumber >= width * height) {
            minesInput.value = width * height - 1;
        }
        mineCount = minesInput.valueAsNumber;

        // Fix board size and reset state
        board.style = "grid-template-columns: repeat(" + width + ", auto); grid-template-rows: repeat(" + height + ", auto);";

        if (tiles.length > width * height) {
            for (let i = width * height; i < tiles.length; i++) {
                tiles[i].tile.remove();
            }
            tiles.length = width * height;
        }

        for (let i = 0; i < tiles.length; i++) {
            tiles[i].reset();
        }

        if (tiles.length < width * height) {
            for (let i = tiles.length; i < width * height; i++) {
                createTile(i);
            }
        }

        gameState = gameNotStarted;
        flagCount = 0;
        hiddenTilesRemaining = tiles.length - mineCount;
        updateMineCount();

        if (timerInterval != null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        time = -1; // updateTimer() increments it by 1
        updateTimer();
    }
}

// Create the tiles
for (let i = 0; i < tiles.length; i++) {
    createTile(i);
}

scaleInput.onchange = function(event) {
    if (isNaN(scaleInput.valueAsNumber)) {
        scaleInput.value = 2;
    }
    const scale = scaleInput.valueAsNumber

    // Borders

    Array.from(game.children).forEach(function(elem) {
        if (elem.localName == "img") {
            if (elem.style.width != "100%") {elem.style.width = 10 * scale + "px";}
            if (elem.style.height != "100%") {elem.style.height = 10 * scale + "px";}
        }
    });

    // Top bar

    mineCountHundreds.width = 13 * scale;
    mineCountHundreds.height = 23 * scale;
    mineCountTens.width = 13 * scale;
    mineCountTens.height = 23 * scale;
    mineCountOnes.width = 13 * scale;
    mineCountOnes.height = 23 * scale;

    timerHundreds.width = 13 * scale;
    timerHundreds.height = 23 * scale;
    timerTens.width = 13 * scale;
    timerTens.height = 23 * scale;
    timerOnes.width = 13 * scale;
    timerOnes.height = 23 * scale;

    Array.from(document.getElementsByClassName("numdisplay")).forEach(function(elem) {
        elem.style.paddingLeft = 6 * scale + "px";
        elem.style.paddingRight = 6 * scale + "px";
        elem.style.paddingTop = 4 * scale + "px";
        elem.style.paddingBottom = 5 * scale + "px";
    })

    button.width = 26 * scale;
    button.height = 26 * scale;
    button.style.paddingTop = 3 * scale + "px";
    button.style.paddingBottom = 3 * scale + "px";

    // Tiles

    tileSize = 16 * scale;
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].tile.style.width = tileSize + "px";
        tiles[i].tile.style.height = tileSize + "px";
    }
}