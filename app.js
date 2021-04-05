document.addEventListener("DOMContentLoaded", function (e) {
    console.group("group");
    console.log(e.type);
    console.log(e.target);
    // ===== DOM Elements
    var grid = document.querySelector(".container-grid");
    var board = document.querySelector(".container-board");
    var outOfBounds = Array.from(document.querySelectorAll(".oob"));
    console.log("outOfBounds: ", outOfBounds);
    // squares as Array<HTMLDivElement>
    var squaresNodeList = document.querySelectorAll(".square");
    // const squares = Array.from(squaresNodeList); // TS2550 Error about Array.from()
    // const squares = [...squaresNodeList];  // TS2488 Error
    var squares = Array.prototype.slice.call(squaresNodeList); // Or, [].slice.call()
    // Use data-* attribute to assign each div an index
    squares.forEach(function (square, index) {
        square.dataset.index = index.toString();
        // Add labels to help
        square.textContent = index.toString();
    });
    var scoreDisplay = document.getElementById("score");
    var startPauseButton = document.getElementById("start-pause-button");
    // ===== Event Listeners
    startPauseButton.addEventListener("click", pauseGame);
    // ===== Game Global State
    // Grid Size
    var width = 10;
    var height = 20;
    var boardSize = width * height;
    // Global game state
    var gameIsActive;
    // Let's create a global currentTetromino that we can use to draw/undraw, etc.
    // NOTE Need to compute only once otherwise a new position will be computed
    // let currentTetromino = computeTetrominoNextPosition(
    //   randomlySelectTetromino(),
    //   initialBoardPosition
    // );
    var currentTetromino;
    // Let's keep track of previousTetromino as well
    var previousTetromino;
    // NOTE Or, I could use Arrow function to have a variable to pass around
    // let initialBoardPosition = () => Math.floor(Math.random() * (7 - 1) + 1);
    // Q: Not sure if this var is needed if I have initializeTetromino() function
    // let initialBoardPosition = computeInitialBoardPosition();
    // let tetrominoIsOutOfBounds: boolean;
    // Q: How to stop the timer?
    // A: Use clearInterval(timerId) to cancel it
    // Need a Timer to keep track and draw/undraw as Tetromino moves
    // 0 means "no timer set": https://stackoverflow.com/questions/5978519/how-to-use-setinterval-and-clearinterval
    var timer = 0;
    // let timerId = setInterval(moveDown, 500);
    // const timerId = setInterval(() => {
    //   if (!tetrominoIsOutOfBounds) {
    //     moveDown();
    //   } else {
    //     // Initialize next Tetromino and assign to currentTetromino
    //     // TODO
    //     // clearInterval(() => initializeTetromino());
    //   }
    // }, 500);
    // ===== Define dimensions Tetrominoes
    // NOTE We have a 10x20 Grid (200 divs) that wrap
    // NOTE Check the file 'Tetrominos' in this project folder
    // === "L" Tetromino rotations
    var lTetromino = [
        // An Array for each position
        [1, width + 1, width * 2 + 1, 2],
        [width, width + 1, width + 2, width * 2 + 2],
        [1, width + 1, width * 2 + 1, width * 2],
        [width, width * 2, width * 2 + 1, width * 2 + 2],
    ];
    var zTetromino = [
        // Only has 2 unique rotations/positions so duplicate
        [width * 2, width * 2 + 1, width + 1, width + 2],
        [0, width, width + 1, width * 2 + 1],
        [width * 2, width * 2 + 1, width + 1, width + 2],
        [0, width, width + 1, width * 2 + 1],
    ];
    var tTetromino = [
        [1, width, width + 1, width + 2],
        [1, width + 1, width * 2 + 1, width + 2],
        [width, width + 1, width + 2, width * 2 + 1],
        [width, 1, width + 1, width * 2 + 1],
    ];
    var oTetromino = [
        [0, 1, width, width + 1],
        [0, 1, width, width + 1],
        [0, 1, width, width + 1],
        [0, 1, width, width + 1],
    ];
    var iTetromino = [
        [1, width + 1, width * 2 + 1, width * 3 + 1],
        [width, width + 1, width + 2, width + 3],
        [1, width + 1, width * 2 + 1, width * 3 + 1],
        [width, width + 1, width + 2, width + 3],
    ];
    var tetrominoes = [
        lTetromino,
        zTetromino,
        tTetromino,
        oTetromino,
        iTetromino,
    ];
    // ===== Define Functions
    // Static:
    // let currentTetrominoRotation = tetrominoes[0][0]; // Should match with lTetromino[0] rotation
    // console.log(currentTetrominoRotation); // [1, 11, 21, 2]
    // Random:
    function randomlySelectTetromino() {
        var randomTetromino = Math.floor(Math.random() * tetrominoes.length);
        // console.log("randomTetromino: ", randomTetromino);
        var randomRotation = Math.floor(Math.random() * tetrominoes[randomTetromino].length);
        // console.log("randomTetrominoRotation: ", randomTetrominoRotation);
        // Now let's put them together for the selectedTetrominoRotation
        var selectedTetrominoAndRotation = tetrominoes[randomTetromino][randomRotation];
        // TODO Check that selected doesn't have OOB or Taken. If so, stop game (it's over)
        // Q: Do I add this check here or inside the initializeTetromino() function?
        // if (isValidTetrominoPosition(selectedTetrominoAndRotation)) {
        //   return selectedTetrominoAndRotation;
        // } else {
        //   stopGame();
        // }
        return selectedTetrominoAndRotation;
    }
    // Randomly select a currentPosition on the Grid
    //const currentGridPosition = Math.floor(Math.random() * squares.length);
    // TODO Account for grid edges so they don't wrap or go off screen
    // Random number in range: https://stackoverflow.com/a/1527820/9901949
    function computeInitialBoardPosition() {
        return Math.floor(Math.random() * (7 - 1) + 1);
    }
    // Add a function that computes whether in Out-of-bounds
    function hasOutOfBounds(tetromino) {
        // Needs a Tetromino Array argument to check if any value is in OOB
        // My idea is to check whether any value (number/index) is out of board range
        // We add 'tetromino' class to draw().
        // Q: Could I just see if any value inside the array of numbers is out of
        // the range? Or, doesn't have a 'square' class?
        return tetromino.some(function (square) { return square < 1 || square > boardSize; });
    }
    // Add a function that computes whether next position has "taken" squares
    function hasTaken(tetromino) {
        return tetromino.some(function (square) {
            return squares[square].classList.contains("taken");
        });
    }
    // Helper function to check whether position is valid
    function isValidTetrominoPosition(tetromino) {
        if (hasOutOfBounds(tetromino) || hasTaken(tetromino)) {
            return false;
        }
        else {
            return true;
        }
        // Q: This same as !! syntax?
    }
    // Create a helper freezeTetromino() method to freeze in place by adding class="taken"
    function freezeTetromino(tetromino) {
        // NOTE Need to redraw the tetromino as well
        tetromino.forEach(function (square) {
            squares[square].classList.add("tetromino", "taken");
            console.log("AFTER freezing: squares[$square].classList:", squares[square].classList);
        });
    }
    // NOTE This could actually be computeINITIALTetrominoPosition
    // since after inits, it goes down by width until reaches bottom
    function computeTetrominoNextPosition(tetromino, boardPosition) {
        if (boardPosition === void 0) { boardPosition = width; }
        var nextTetrominoPosition = tetromino.map(function (square) {
            return square + boardPosition;
        });
        // Add check that next Tetromino position won't be OOB
        if (!isValidTetrominoPosition(nextTetrominoPosition)) {
            console.log("OOB || Taken! Freezing tetromino: ", tetromino);
            // NOTE Freeze the ORIGINAL tetromino, not the nextTetrominoPosition
            // Check the classList BEFORE freezing:
            tetromino.forEach(function (square) {
                console.log("BEFORE freezing: squares[$square].classList:", squares[square].classList);
            });
            // FIXME Need to redraw to keep frozen piece visible on board. Currently
            // it gets undrawn FIRST inside moveDown() before doing this compute.
            // Probably a better way...
            // UPDATE I added the "tetromino" class along with "taken" inside freezeTetromino()
            // to reduce the loops.
            // drawTetromino(tetromino); // Added "tetromino" class inside freezeTetromino()
            freezeTetromino(tetromino);
            // Intitialize a new/next Tetromino and update global currentTetromino
            // currentTetromino = initializeTetromino();
            initializeTetromino();
            // NOTE Do not drawTetromino() here as it is called next inside moveDown()
            return currentTetromino;
        }
        else {
            // Position is not OOB or Taken so we can update global currentTetromino
            currentTetromino = nextTetrominoPosition;
            return currentTetromino;
        }
    }
    function drawTetromino(tetromino) {
        // console.log("drawTetromino: ", tetromino);
        // Need to find matching/corresponding squares in the grid and add CSS class to each
        // Loop over the array of squares/dimensions inside currentTetrominoGridPosition
        tetromino.forEach(function (square) {
            squares[square].classList.add("tetromino");
        });
    }
    // Draw initial Tetromino onto the grid/board
    // drawTetromino(currentTetromino);
    function undrawTetromino(tetromino) {
        // console.log("undrawTetromino: ", tetromino);
        tetromino.forEach(function (square) {
            squares[square].classList.remove("tetromino");
        });
    }
    //setTimeout(() => undrawTetromino(currentTetromino), 3000); // works
    function moveDown() {
        // Needs to take currentTetromino Grid Position and undraw() it
        undrawTetromino(currentTetromino);
        // Then recompute the new updated Grid Position (shift down by width)
        // currentTetromino = currentTetromino.map((square) => square + width);
        // NOTE gripPosition arg is optional (default is width)
        // FIXME When re-initializing a new Tetromino (initializeTetromino()),
        // the GLOBAL currentTetromino is correctly updated via currentTetromino = nextTetromino.
        // However, two things go wrong:
        // 1. The new currentTetromino is never drawn to the board
        // 2. moveDown() OVERWRITES the new currentTetromino value by:
        // currentTetromino = computeTetrominoNextPosition(currentTetromino). The problem is
        // inside the compute function, the var currentTetromionGridPosition still holds the
        // OLD/OOB values from the PREVIOUS Tetromino!
        // Q: Don't think I need to reset currentTetromino here since doing this inside computeTetrominoNextPosition()
        // currentTetromino = computeTetrominoNextPosition(currentTetromino);
        // Call directly and it should already update the global currentTetromino, which can
        // be used inside the next drawTetromino(currentTetromino)
        // Q: Should I use a try/catch here in case it computes to OOB?
        try {
            computeTetrominoNextPosition(currentTetromino);
            // Then draw() the Tetromino at the new Grid Position
            drawTetromino(currentTetromino);
        }
        catch (error) {
            console.log(error);
        }
        // Add stopGame() to check
        stopGame();
    }
    // Need a function that initializeTetromino (not the GAME, just Tetromino)
    function initializeTetromino() {
        // Init and/or update global currentTetromino
        try {
            // UPDATE Need to possibly try/catch since added a isValidTetrominoPosition check
            // inside randomlySelectTetromino().
            var selectedTetrominoAndRotation = randomlySelectTetromino();
            if (isValidTetrominoPosition(selectedTetrominoAndRotation)) {
                var tetrominoNextPosition = computeTetrominoNextPosition(selectedTetrominoAndRotation, computeInitialBoardPosition());
                // Check whether this is also valid after its been repositioned
                if (isValidTetrominoPosition(tetrominoNextPosition)) {
                    // Only now do we update the global currentTetromino with this new value
                    currentTetromino = tetrominoNextPosition;
                }
                else {
                    console.log("The randomly selected Tetromino was okay but NOT the potential after computing position");
                    stopGame();
                }
            }
            else {
                console.log("The randomly selected Tetromino was NOT a valid position");
                stopGame();
            }
        }
        catch (error) {
            console.log(error.message);
        }
    }
    // === Testing stuff out
    // Store currentTetromino in global previousTetromino
    // NOTE Check whether this is start of game (first Tetromino)
    // if (currentTetromino.length === 0) {
    //   // It's the first Tetromino of the game
    //   // So there is no previousTetromino
    //   currentTetromino = nextTetromino;
    // } else {
    //   previousTetromino = currentTetromino;
    //   // Update global currentTetromino with new nextTetromino
    //   currentTetromino = nextTetromino;
    //   return nextTetromino
    // Draw this new Tetromino on the board in its initial position
    // drawTetromino(currentTetromino);
    // Q: Do I have to return this if I'm already updating the global var?
    // return currentTetromino;
    // Create a startGame() that gets everything started
    // NOTE This function is only ran once to start the game
    function startGame() {
        // Set globals
        gameIsActive = true;
        // currentTetromino = initializeTetromino();
        initializeTetromino();
        drawTetromino(currentTetromino);
        // Initiate game timer with interval
        timer = setInterval(moveDown, 200);
    }
    startGame();
    // Handler for the click event on the button
    function pauseGame() {
        console.log("pauseGame triggered");
        clearInterval(timer);
        timer = 0; // Ensure we've cleared the interval
        gameIsActive = false;
    }
    // Function to stop the game and game timer
    function stopGame() {
        // Need some conditions to check
        var topRow = squares.slice(0, 9);
        // console.log("topRow:", topRow);
        var topRowAllTaken = topRow.every(function (row) {
            return row.classList.contains("taken");
        });
        if (topRowAllTaken || !gameIsActive) {
            gameIsActive = false;
            clearInterval(timer);
        }
    }
});
