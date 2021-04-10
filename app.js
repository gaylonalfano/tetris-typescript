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
    var startStopButton = document.getElementById("start-stop-button");
    // ===== Event Listeners
    startStopButton.addEventListener("click", stopGame);
    document.addEventListener("keyup", control);
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
    //   initialBoardIndex
    // );
    var tetrominoIndex = 0; // Only 5 different Tetrominoes
    var rotationIndex = 0; // Only max of 4 rotations depending on Tetromino
    var selectedTetrominoAndRotation; // To help with rotating used with currentBoardIndex
    var currentBoardIndex = 4; // To keep track of where on board. Hardcode instead of random
    var currentTetromino;
    // Let's keep track of previousTetromino as well
    var previousTetromino;
    // NOTE Or, I could use Arrow function to have a variable to pass around
    // let initialBoardIndex = () => Math.floor(Math.random() * (7 - 1) + 1);
    // Q: Not sure if this var is needed if I have initializeTetromino() function
    // let initialBoardIndex = computeInitialBoardIndex();
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
        // Let's update the global tetrominoIndex and rotationIndex numbers for rotate()
        tetrominoIndex = randomTetromino;
        rotationIndex = randomRotation;
        // Now let's put them together for the selectedTetrominoRotation
        var selectedTetrominoAndRotation = tetrominoes[randomTetromino][randomRotation]; // Or, randomRotation if we want
        // console.log(
        //   "randomlySelectTetromino:selectedTetrominoAndRotation: ",
        //   selectedTetrominoAndRotation
        // );
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
    // UPDATE Going to set currentBoardIndex = 4 from the beginning instead of random
    // function computeInitialBoardIndex() {
    //   return Math.floor(Math.random() * (7 - 1) + 1);
    // }
    // Add a function that computes whether in Out-of-bounds
    function hasOutOfBounds(tetromino) {
        // Needs a Tetromino Array argument to check if any value is in OOB
        // My idea is to check whether any value (number/index) is out of board range
        // We add 'tetromino' class to draw().
        // Q: Could I just see if any value inside the array of numbers is out of
        // the range? Or, doesn't have a 'square' class?
        return tetromino.some(function (square) { return square < 0 || square > boardSize; });
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
    function computeTetrominoNextPosition(tetromino, boardIndex) {
        if (tetromino === void 0) { tetromino = selectedTetrominoAndRotation; }
        if (boardIndex === void 0) { boardIndex = currentBoardIndex; }
        var tetrominoNextPosition = tetromino.map(function (square) {
            return square + boardIndex;
        });
        // TODO
        // UPDATE Moving this validation check to ...where???
        // // Add check that next Tetromino position won't be OOB
        // if (!isValidTetrominoPosition(tetrominoNextPosition)) {
        //   console.log("OOB || Taken! Freezing tetromino: ", tetromino);
        //   // NOTE Freeze the ORIGINAL tetromino, not the tetrominoNextPosition
        //   // Check the classList BEFORE freezing:
        //   tetromino.forEach((square) => {
        //     console.log(
        //       `BEFORE freezing: squares[$square].classList:`,
        //       squares[square].classList
        //     );
        //   });
        //   // FIXME Need to redraw to keep frozen piece visible on board. Currently
        //   // it gets undrawn FIRST inside moveDown() before doing this compute.
        //   // Probably a better way...
        //   // UPDATE I added the "tetromino" class along with "taken" inside freezeTetromino()
        //   // to reduce the loops.
        //   // drawTetromino(tetromino); // Added "tetromino" class inside freezeTetromino()
        //   freezeTetromino(tetromino);
        //   // Intitialize a new/next Tetromino and update global currentTetromino
        //   // currentTetromino = initializeTetromino();
        //   initializeTetromino();
        //   // NOTE Do not drawTetromino() here as it is called next inside moveDown()
        //   return currentTetromino;
        // } else {
        //   // Position is not OOB or Taken so we can update global currentTetromino
        //   currentTetromino = tetrominoNextPosition;
        //   return currentTetromino;
        // }
        return tetrominoNextPosition;
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
    function control(e) {
        // Going to listen for certain KeyboardEvents to move the Tetromino
        console.log(e.key);
        console.log(e.code);
        if (e.key === "ArrowLeft") {
            moveLeft();
        }
        else if (e.key === "ArrowRight") {
            moveRight();
        }
        else if (e.key === "ArrowUp") {
            rotate();
        }
        else if (e.key === "ArrowDown") {
            moveDown();
        }
    }
    function rotate() {
        undrawTetromino(currentTetromino);
        // Let's get the max value of the currentTetromino before rotating
        // Q: How to get max value in array?
        // A: Use Math.max(...array) where array: number[]
        // Q: How to round down to nearest tens position?
        // A: Use Math.floor(number / 10) * 10  (Math.round or Math.ceil for rounding up)
        var currentRow = Math.floor(Math.max.apply(Math, currentTetromino) / 10) * 10;
        // console.log("rotate:currentRow: ", currentRow); // 129 -> 120
        // let currentRowCeil: number =
        //   Math.ceil(Math.max(...currentTetromino) / 10) * 10;
        // console.log("rotate:currentRowCeil: ", currentRowCeil); // 129 -> 130
        var currentColumn = Math.max.apply(Math, currentTetromino) % width;
        // console.log("rotate:currentColumn: ", currentColumn);
        // Undraw the original tetromino as we're about to rotate and redraw
        // console.log("rotate:currentTetromino:BEFORE: ", currentTetromino);
        // console.log("rotate:timer:BEFORE: ", timer); // 10 Same as AFTER
        rotationIndex++;
        if (rotationIndex === currentTetromino.length) {
            // Need to increment ++ rotationIndex. If 3 then reset to 0
            rotationIndex = 0;
        }
        // Update global currentTetromino value with new rotation
        // but retain the tetrominoIndex out of tetrominoes array
        var tetrominoNextRotation = tetrominoes[tetrominoIndex][rotationIndex];
        // console.log("rotate:tetrominoNextRotation: ", tetrominoNextRotation);
        // console.log("rotate:timer:BEFORE: ", timer); // 10 Same as BEFORE
        var tetrominoNextPosition = tetrominoNextRotation.map(function (square) { return square + currentRow + currentColumn; });
        // console.log("rotate:tetrominoNextPosition: ", tetrominoNextPosition);
        // TODO Validate this new position before drawing
        if (isValidTetrominoPosition(tetrominoNextPosition)) {
            // Update global currentTetromino
            currentTetromino = tetrominoNextPosition;
        }
        drawTetromino(currentTetromino);
    }
    function moveDown() {
        console.log("moveDown:currentTetromino:BEFORE ", currentTetromino);
        console.log("moveDown:currentBoardIndex:BEFORE ", currentBoardIndex);
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
            // Update currentBoardIndex by width
            currentBoardIndex += width;
            console.log("moveDown:currentBoardIndex:AFTER ", currentBoardIndex);
            // Compute next position using currentTetromino
            // let tetrominoNextPosition = computeTetrominoNextPosition(
            //   currentTetromino
            // );
            // Compute next position using selectedTetrominoAndRotation + currentBoardIndex
            var tetrominoNextPosition = computeTetrominoNextPosition(selectedTetrominoAndRotation, currentBoardIndex);
            if (isValidTetrominoPosition(tetrominoNextPosition)) {
                // Update the global currentTetromino
                currentTetromino = tetrominoNextPosition;
                // Then draw() the Tetromino at the new Grid Position
                drawTetromino(currentTetromino);
            }
            else {
                // Freeze ORIGINAL Tetromino in place
                freezeTetromino(currentTetromino);
                // Re-init next Tetromino if valid and update global currentTetromino
                initializeTetromino();
                // Draw this new Tetromino (stored in global currentTetromino)
                // NOTE Technically I could remove the drawTetromino() call outside of if/else
                drawTetromino(currentTetromino);
            }
            console.log("moveDown:currentTetromino:AFTER ", currentTetromino);
        }
        catch (error) {
            console.log(error);
        }
        // Q: This needed since I'm doing the check inside initializeTetromino()
        // and stopping the game if it's not valid?
        // A: Nope! Don't need to make this redundant call.
        // Add stopGame() to check
        // stopGame();
    }
    /*
     * This is the moveLeft() multiline comment.
     * @param
     *
     */
    function moveLeft() {
        // Clear currentTetromino from board
        undrawTetromino(currentTetromino);
        // Define the left edge (not OOB since it's outside of the grid)
        var isAtLeftEdge = currentTetromino.some(function (square) { return square % width === 0; });
        if (!isAtLeftEdge) {
            // Decrement currentBoardIndex
            currentBoardIndex -= 1;
            // Check whether the next position shifted left by one square is valid
            var tetrominoNextPosition = computeTetrominoNextPosition(currentTetromino, -1);
            console.log("moveLeft:tetrominoNextPosition: ", tetrominoNextPosition);
            // Q: Need to add a validation check?
            // A: Think so as it could collide with 'taken' or 'oob' squares
            if (isValidTetrominoPosition(tetrominoNextPosition)) {
                currentTetromino = tetrominoNextPosition;
                drawTetromino(currentTetromino);
            }
            else {
                // Revert currentBoardIndex to previous value (go right one)
                currentBoardIndex += 1;
            }
        }
        // Originally/already at left edge so just draw
        drawTetromino(currentTetromino);
    }
    function moveRight() {
        // Clear currentTetromino from board
        undrawTetromino(currentTetromino);
        // Define the right edge (not OOB since it's outside of the grid)
        var isAtRightEdge = currentTetromino.some(function (square) { return (square + 1) % width === 0; }
        // Or, square % width === width - 1
        );
        if (!isAtRightEdge) {
            // Decrement currentBoardIndex
            currentBoardIndex += 1;
            // Check whether the next position shifted right by one square is valid
            var tetrominoNextPosition = computeTetrominoNextPosition(currentTetromino, 1);
            console.log("moveLeft:tetrominoNextPosition: ", tetrominoNextPosition);
            // Q: Need to add a validation check?
            // A: Think so as it could collide with 'taken' or 'oob' squares
            if (isValidTetrominoPosition(tetrominoNextPosition)) {
                currentTetromino = tetrominoNextPosition;
                drawTetromino(currentTetromino);
            }
            else {
                // Revert currentBoardIndex to previous value (go left one)
                currentBoardIndex -= 1;
            }
        }
        // Originally/already at right edge so just draw
        drawTetromino(currentTetromino);
    }
    // Need a function that initializeTetromino (not the GAME, just Tetromino)
    function initializeTetromino() {
        // Reset the currentBoardIndex back to 4
        currentBoardIndex = 4;
        // Init and/or update global currentTetromino
        try {
            // UPDATE Need to possibly try/catch since added a isValidTetrominoPosition check
            // inside randomlySelectTetromino().
            // let selectedTetrominoAndRotation: number[] = randomlySelectTetromino();
            // Use global instead:
            selectedTetrominoAndRotation = randomlySelectTetromino();
            if (isValidTetrominoPosition(selectedTetrominoAndRotation)) {
                console.log("initializeTetromino:selectedTetrominoAndRotation: ", selectedTetrominoAndRotation);
                console.log("initializeTetromino:isValidTetrominoPosition(): ", isValidTetrominoPosition(selectedTetrominoAndRotation));
                var tetrominoNextPosition = computeTetrominoNextPosition(selectedTetrominoAndRotation, currentBoardIndex);
                console.log("initializeTetromino:currentBoardIndex: ", currentBoardIndex);
                console.log("initializeTetromino:tetrominoNextPosition: ", tetrominoNextPosition);
                // Check whether this is also valid after its been repositioned
                if (isValidTetrominoPosition(tetrominoNextPosition)) {
                    // Only now do we update the global currentTetromino with this new value
                    currentTetromino = tetrominoNextPosition;
                    // Q: Draw to the board? Or draw inside moveDown()?
                    // A: Gonna draw inside moveDown() to be more explicit.
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
    function stopGame() {
        console.log("stopGame triggered");
        clearInterval(timer);
        timer = 0; // Ensure we've cleared the interval
        gameIsActive = false;
    }
    // Function to stop the game and game timer
    // function stopGameWithConditions(): void {
    //   // Need some conditions to check
    //   const topRow: HTMLDivElement[] = squares.slice(0, 9);
    //   // console.log("topRow:", topRow);
    //   const topRowAllTaken: boolean = topRow.every((row) =>
    //     row.classList.contains("taken")
    //   );
    //   if (topRowAllTaken || !gameIsActive) {
    //     gameIsActive = false;
    //     clearInterval(timer);
    //   }
    // }
});
