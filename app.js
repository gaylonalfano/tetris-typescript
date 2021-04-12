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
    var startPauseButton = document.getElementById("start-stop-button");
    var upNextGrid = document.querySelector(".container-up-next-grid");
    var upNextSquaresNodeList = document.querySelectorAll(".up-next-square");
    var upNextSquares = Array.from(upNextSquaresNodeList);
    upNextSquares.forEach(function (square, index) {
        square.textContent = index.toString();
    });
    // ===== Event Listeners
    startPauseButton.addEventListener("click", toggleGame);
    document.addEventListener("keyup", control);
    // ===== Game Global State
    // Grid Size
    var width = 10;
    var height = 20;
    var boardSize = width * height;
    // upNext Grid Size
    var upNextGridWidth = 4;
    var upNextGridHeight = 4;
    // Global game state
    var gameIsActive = false;
    // Let's create a global currentTetromino that we can use to draw/undraw, etc.
    // NOTE Need to compute only once otherwise a new position will be computed
    // let currentTetromino = computeTetrominoNextPosition(
    //   randomlySelectTetromino(),
    //   initialBoardIndex
    // );
    var tetrominoIndex = 0; // Only 5 different Tetrominoes
    var rotationIndex = 0; // Only max of 4 rotations depending on Tetromino
    var upNextTetrominoIndex = 0; // Added when upNextTetromino
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
    var timer;
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
    // Define upNextTetrominoes to display in mini upNextGrid
    var upNextTetrominoes = [
        [1, upNextGridWidth + 1, upNextGridWidth * 2 + 1, 2],
        [
            upNextGridWidth * 2,
            upNextGridWidth * 2 + 1,
            upNextGridWidth + 1,
            upNextGridWidth + 2,
        ],
        [1, upNextGridWidth, upNextGridWidth + 1, upNextGridWidth + 2],
        [0, 1, upNextGridWidth, upNextGridWidth + 1],
        [1, upNextGridWidth + 1, upNextGridWidth * 2 + 1, upNextGridWidth * 3 + 1],
    ];
    // ===== Define Functions
    // Static:
    // let currentTetrominoRotation = tetrominoes[0][0]; // Should match with lTetromino[0] rotation
    // console.log(currentTetrominoRotation); // [1, 11, 21, 2]
    // Random:
    function randomlySelectTetromino() {
        var randomTetrominoIndex = Math.floor(Math.random() * tetrominoes.length);
        // console.log("randomTetrominoIndex: ", randomTetrominoIndex);
        var randomRotationIndex = Math.floor(Math.random() * tetrominoes[randomTetrominoIndex].length);
        // console.log("randomTetrominoRotation: ", randomTetrominoRotation);
        // Let's update the global tetrominoIndex and rotationIndex numbers for rotate()
        // Q: Could this be where I update a global upNextTetromino value as well?
        // E.g, upNextTetromino = upNextTetrominoes[tetrominoIndex]
        // A: YES! The below code achieves what we want!
        // First set current tetrominoIndex to existing upNextTetrominoIndex
        tetrominoIndex = upNextTetrominoIndex;
        // Then update upNextTetrominoIndex with a randomTetrominoIndex value
        upNextTetrominoIndex = randomTetrominoIndex;
        // Set current rotationIndex to a randomRotationIndex
        rotationIndex = randomRotationIndex;
        // Now let's put them together for the selectedTetrominoRotation
        var selectedTetrominoAndRotation = tetrominoes[tetrominoIndex][rotationIndex]; // Or, randomRotationIndex if we want
        return selectedTetrominoAndRotation;
    }
    function drawUpNextTetromino() {
        // Clear/undraw our mini upNextGrid
        upNextSquares.forEach(function (square) {
            return square.classList.remove("tetromino");
        });
        // Grab the upNextTetromino using upNextTetrominoIndex and add "tetromino" class
        var upNextTetromino = upNextTetrominoes[upNextTetrominoIndex];
        console.log("upNextTetromino: ", upNextTetromino);
        upNextTetromino.forEach(function (square) {
            upNextSquares[square].classList.add("tetromino");
        });
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
    function freezeTetromino(tetromino) {
        tetromino.forEach(function (square) {
            squares[square].classList.add("tetromino", "taken");
            console.log("AFTER freezing: squares[$square].classList:", squares[square].classList);
        });
    }
    function computeTetrominoNextPosition(tetromino, boardIndex) {
        if (tetromino === void 0) { tetromino = currentTetromino; }
        if (boardIndex === void 0) { boardIndex = currentBoardIndex; }
        return tetromino.map(function (square) {
            return square + boardIndex;
        });
    }
    function drawTetromino() {
        currentTetromino.forEach(function (square) {
            squares[square + currentBoardIndex].classList.add("tetromino");
        });
    }
    function undrawTetromino() {
        currentTetromino.forEach(function (square) {
            squares[square + currentBoardIndex].classList.remove("tetromino");
        });
    }
    function control(e) {
        // Going to listen for certain KeyboardEvents to move the Tetromino
        console.log(e.key);
        // console.log(e.code);
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
        undrawTetromino();
        // Let's get the max value of the currentTetromino before rotating
        // Q: How to get max value in array?
        // A: Use Math.max(...array) where array: number[]
        // Q: How to round down to nearest tens position?
        // A: Use Math.floor(number / 10) * 10  (Math.round or Math.ceil for rounding up)
        // let currentRow: number =
        //   Math.floor(Math.max(...currentTetromino) / 10) * 10;
        // console.log("rotate:currentRow: ", currentRow); // 129 -> 120
        // let currentRowCeil: number =
        //   Math.ceil(Math.max(...currentTetromino) / 10) * 10;
        // console.log("rotate:currentRowCeil: ", currentRowCeil); // 129 -> 130
        // let currentColumn: number = Math.max(...currentTetromino) % width;
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
        currentTetromino = tetrominoes[tetrominoIndex][rotationIndex];
        // FIXME Don't let it rotate through to the other side
        drawTetromino();
    }
    function moveDown() {
        // console.log("moveDown:currentBoardIndex:BEFORE ", currentBoardIndex);
        undrawTetromino();
        // Compute tetrominoCurrentPosition before shifting down by width
        var tetrominoCurrentPosition = computeTetrominoNextPosition();
        // Shift down by width and update currentBoardIndex
        currentBoardIndex += width;
        // Compute next position using updated currentBoardIndex
        var tetrominoNextPosition = computeTetrominoNextPosition();
        if (!isValidTetrominoPosition(tetrominoNextPosition)) {
            // Freeze tetrominoCurrentPosition
            freezeTetromino(tetrominoCurrentPosition);
            initializeTetromino();
            drawUpNextTetromino();
        }
        drawTetromino();
    }
    function moveLeft() {
        undrawTetromino();
        // Define the left edge (not OOB since it's outside of the grid)
        var isAtLeftEdge = currentTetromino.some(function (square) { return (square + currentBoardIndex) % width === 0; });
        if (!isAtLeftEdge) {
            // Decrement currentBoardIndex
            currentBoardIndex -= 1;
            // Check whether the next position shifted left by one square is valid
            var tetrominoNextPosition = computeTetrominoNextPosition();
            console.log("moveLeft:tetrominoNextPosition: ", tetrominoNextPosition);
            // Q: Need to add a validation check?
            // A: Think so as it could collide with 'taken' or 'oob' squares
            if (!isValidTetrominoPosition(tetrominoNextPosition)) {
                // Revert currentBoardIndex to previous value (go right one)
                currentBoardIndex += 1;
            }
        }
        drawTetromino();
    }
    function moveRight() {
        undrawTetromino();
        // Define the right edge (not OOB since it's outside of the grid)
        var isAtRightEdge = currentTetromino.some(function (square) { return (square + currentBoardIndex + 1) % width === 0; });
        if (!isAtRightEdge) {
            // Decrement currentBoardIndex
            currentBoardIndex += 1;
            // Check whether the next position shifted right by one square is valid
            var tetrominoNextPosition = computeTetrominoNextPosition();
            console.log("moveLeft:tetrominoNextPosition: ", tetrominoNextPosition);
            // Q: Need to add a validation check?
            // A: Think so as it could collide with 'taken' or 'oob' squares
            if (!isValidTetrominoPosition(tetrominoNextPosition)) {
                // Revert currentBoardIndex to previous value (go left one)
                currentBoardIndex -= 1;
            }
        }
        drawTetromino();
    }
    // Need a function that initializeTetromino (not the GAME, just Tetromino)
    function initializeTetromino() {
        // Reset the currentBoardIndex back to 4
        currentBoardIndex = 4;
        // Init and/or update global currentTetromino
        currentTetromino = randomlySelectTetromino();
        console.log("initializeTetromino:currentTetromino: ", currentTetromino);
        // Q: Validate this initialized Tetromino here or inside moveDown?
        if (isValidTetrominoPosition(currentTetromino)) {
            console.log("initializeTetromino:isValidTetrominoPosition(): ", isValidTetrominoPosition(currentTetromino));
            var tetrominoNextPosition = computeTetrominoNextPosition();
            console.log("initializeTetromino:currentBoardIndex: ", currentBoardIndex);
            console.log("initializeTetromino:tetrominoNextPosition: ", tetrominoNextPosition);
            // Check whether this is also valid after its been repositioned by currentBoardIndex
            if (isValidTetrominoPosition(tetrominoNextPosition)) {
                // Q: Draw here or inside moveDown()?
                drawTetromino();
            }
            else {
                console.log("The randomly selected Tetromino (currentTetromino) was okay but NOT the computed tetrominoNextPosition that uses currentBoardIndex");
                endGame();
            }
        }
        else {
            console.log("The randomly selected Tetromino (currentTetromino) was NOT a valid position");
            endGame();
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
    // Create a toggleGame() that gets everything started
    // NOTE This function is only ran once to start the game
    function toggleGame() {
        if (timer) {
            // Game is running so let's pause it
            clearInterval(timer);
            timer = 0;
        }
        else {
            // Game isn't running so either hasn't started or currently paused
            if (!gameIsActive) {
                // Game is STARTING
                // Initialize the start of the game by setting globals
                console.log("Starting game... timer: ", timer);
                gameIsActive = true;
                initializeTetromino();
                drawUpNextTetromino();
                // Initiate game timer with interval
                timer = setInterval(moveDown, 500);
            }
            else {
                // Game is PAUSED. Let's resume the game.
                // drawUpNextTetromino();
                timer = setInterval(moveDown, 500);
            }
        }
        // FAILED
        // Let's check whether the game is already going
        // if (!timer) {
        //   // Initialize the start of the game by setting globals
        //   console.log("Starting game... timer: ", timer);
        //   gameIsActive = true;
        //   initializeTetromino();
        //   drawTetromino();
        //   drawUpNextTetromino();
        //   // Initiate game timer with interval
        //   timer = setInterval(moveDown, 500);
        // } else if (timer) {
        //   // Game has started
        //   // TODO Check if currently paused
        //   console.log("Pausing game... timer BEFORE: ", timer);
        //   // Let's store the timer value at pause
        //   // Let's store a copy for local pausedTimer
        //   // let pausedTimer = timer;
        //   clearInterval(timer);
        //   // timer = 0;
        //   console.log("Pausing game... timer AFTER: ", timer);
        // }
    }
    // Handler for the click event on the button
    function endGame() {
        console.log("endGame triggered");
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
