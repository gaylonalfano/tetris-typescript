document.addEventListener("DOMContentLoaded", (e) => {
  // console.group("group");
  // console.log(e.type);
  // console.log(e.target);
  // ===== DOM Elements
  const grid = document.querySelector(".container-grid") as HTMLDivElement;
  const board = document.querySelector(".container-board") as HTMLElement;
  const outOfBounds = Array.from(
    document.querySelectorAll(".oob") as NodeListOf<HTMLElement>
  ) as Array<HTMLElement>;
  // console.log("outOfBounds: ", outOfBounds);
  // squares as Array<HTMLDivElement>
  const squaresNodeList = document.querySelectorAll(
    ".square"
  ) as NodeListOf<HTMLDivElement>;
  // const squares = Array.from(squaresNodeList); // TS2550 Error about Array.from()
  // const squares = [...squaresNodeList];  // TS2488 Error
  let squares = Array.prototype.slice.call(
    squaresNodeList
  ) as Array<HTMLDivElement>; // Or, [].slice.call()

  // Use data-* attribute to assign each div an index
  squares.forEach((square, index) => {
    square.dataset.index = index.toString();
    // Add labels to help
    square.textContent = index.toString();
  });

  const scoreDisplay = document.getElementById("score") as HTMLSpanElement;
  const rowsDisplay = document.getElementById("rows") as HTMLSpanElement;
  const startPauseButton = document.getElementById(
    "start-stop-button"
  ) as HTMLButtonElement;

  const upNextGrid = document.querySelector(
    ".container-up-next-grid"
  ) as HTMLDivElement;

  const upNextSquaresNodeList = document.querySelectorAll(
    ".up-next-square"
  ) as NodeListOf<HTMLDivElement>;

  const upNextSquares = Array.from(
    upNextSquaresNodeList
  ) as Array<HTMLDivElement>;

  upNextSquares.forEach((square, index) => {
    square.textContent = index.toString();
  });

  // ===== Event Listeners
  startPauseButton.addEventListener("click", toggleGame);
  document.addEventListener("keyup", control);

  // ===== Game Global State
  // Grid Size
  const width = 10;
  const height = 20;
  const boardSize = width * height;

  // upNext Grid Size
  const upNextGridWidth = 4;
  const upNextGridHeight = 4;

  // Global game state
  let gameIsActive: boolean = false;
  let score: number = 0;
  let completedRows: number = 0;

  // Let's create a global currentTetromino that we can use to draw/undraw, etc.
  // NOTE Need to compute only once otherwise a new position will be computed
  // let currentTetromino = computeTetrominoNextPosition(
  //   randomlySelectTetromino(),
  //   initialBoardIndex
  // );
  let tetrominoIndex: number = 0; // Only 5 different Tetrominoes
  let rotationIndex: number = 0; // Only max of 4 rotations depending on Tetromino
  let upNextTetrominoIndex: number = 0; // Added when upNextTetromino
  let currentBoardIndex: number = 4; // To keep track of where on board. Hardcode instead of random
  let currentTetromino: number[];
  // Let's keep track of previousTetromino as well
  let previousTetromino: number[];

  // NOTE Or, I could use Arrow function to have a variable to pass around
  // let initialBoardIndex = () => Math.floor(Math.random() * (7 - 1) + 1);
  // Q: Not sure if this var is needed if I have initializeTetromino() function
  // let initialBoardIndex = computeInitialBoardIndex();
  // let tetrominoIsOutOfBounds: boolean;

  // Q: How to stop the timer?
  // A: Use clearInterval(timerId) to cancel it
  // Need a Timer to keep track and draw/undraw as Tetromino moves
  // 0 means "no timer set": https://stackoverflow.com/questions/5978519/how-to-use-setinterval-and-clearinterval
  let timer: number;
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
  const lTetromino: Array<number[]> = [
    // An Array for each position
    [1, width + 1, width * 2 + 1, 2],
    [width, width + 1, width + 2, width * 2 + 2],
    [1, width + 1, width * 2 + 1, width * 2],
    [width, width * 2, width * 2 + 1, width * 2 + 2],
  ];

  const zTetromino: Array<number[]> = [
    // Only has 2 unique rotations/positions so duplicate
    [width * 2, width * 2 + 1, width + 1, width + 2],
    [0, width, width + 1, width * 2 + 1],
    [width * 2, width * 2 + 1, width + 1, width + 2],
    [0, width, width + 1, width * 2 + 1],
  ];

  const tTetromino: Array<number[]> = [
    [1, width, width + 1, width + 2],
    [1, width + 1, width * 2 + 1, width + 2],
    [width, width + 1, width + 2, width * 2 + 1],
    [width, 1, width + 1, width * 2 + 1],
  ];

  const oTetromino: Array<number[]> = [
    [0, 1, width, width + 1],
    [0, 1, width, width + 1],
    [0, 1, width, width + 1],
    [0, 1, width, width + 1],
  ];

  const iTetromino: Array<number[]> = [
    [1, width + 1, width * 2 + 1, width * 3 + 1],
    [width, width + 1, width + 2, width + 3],
    [1, width + 1, width * 2 + 1, width * 3 + 1],
    [width, width + 1, width + 2, width + 3],
  ];

  const tetrominoes = [
    lTetromino,
    zTetromino,
    tTetromino,
    oTetromino,
    iTetromino,
  ];

  // Define upNextTetrominoes to display in mini upNextGrid
  const upNextTetrominoes = [
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
  function randomlySelectTetromino(): number[] {
    const randomTetrominoIndex = Math.floor(Math.random() * tetrominoes.length);
    // console.log("randomTetrominoIndex: ", randomTetrominoIndex);
    const randomRotationIndex = Math.floor(
      Math.random() * tetrominoes[randomTetrominoIndex].length
    );
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
    const selectedTetrominoAndRotation =
      tetrominoes[tetrominoIndex][rotationIndex]; // Or, randomRotationIndex if we want

    return selectedTetrominoAndRotation;
  }

  function drawUpNextTetromino() {
    // Clear/undraw our mini upNextGrid
    upNextSquares.forEach((square: HTMLDivElement) =>
      square.classList.remove("tetromino")
    );

    // Grab the upNextTetromino using upNextTetrominoIndex and add "tetromino" class
    let upNextTetromino = upNextTetrominoes[upNextTetrominoIndex];
    console.log("upNextTetromino: ", upNextTetromino);
    upNextTetromino.forEach((square) => {
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
  function hasOutOfBounds(tetromino: number[]): boolean {
    // Needs a Tetromino Array argument to check if any value is in OOB
    // My idea is to check whether any value (number/index) is out of board range
    // We add 'tetromino' class to draw().
    // Q: Could I just see if any value inside the array of numbers is out of
    // the range? Or, doesn't have a 'square' class?
    return tetromino.some(
      (square: number) => square < 0 || square >= boardSize
    );
  }

  // Add a function that computes whether next position has "taken" squares
  function hasTaken(tetromino: number[]): boolean {
    return tetromino.some((square: number) =>
      squares[square].classList.contains("taken")
    );
  }

  // Helper function to check whether position is valid
  function isValidTetrominoPosition(tetromino: number[]): boolean {
    if (hasOutOfBounds(tetromino) || hasTaken(tetromino)) {
      return false;
    } else {
      return true;
    }
    // Q: This same as !! syntax?
  }

  function freezeTetromino(tetromino: number[]): void {
    tetromino.forEach((square: number) => {
      squares[square].classList.add("tetromino", "taken");
      console.log(
        `AFTER freezing: squares[$square].classList:`,
        squares[square].classList
      );
    });
  }

  function computeTetrominoNextPosition(
    tetromino: number[] = currentTetromino,
    boardIndex: number = currentBoardIndex
  ): number[] {
    return tetromino.map((square: number) => {
      return square + boardIndex;
    });
  }

  function drawTetromino(): void {
    currentTetromino.forEach((square: number) => {
      squares[square + currentBoardIndex].classList.add("tetromino");
    });
  }

  function undrawTetromino(): void {
    currentTetromino.forEach((square) => {
      squares[square + currentBoardIndex].classList.remove("tetromino");
    });
  }

  function control(e: KeyboardEvent) {
    // Going to listen for certain KeyboardEvents to move the Tetromino
    console.log(e.key);
    // console.log(e.code);
    if (e.key === "ArrowLeft") {
      moveLeft();
    } else if (e.key === "ArrowRight") {
      moveRight();
    } else if (e.key === "ArrowUp") {
      rotate();
    } else if (e.key === "ArrowDown") {
      // TODO Implement ability to quickly double ArrowDown
      moveDown();
    }
  }

  function rotate(): void {
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

  function moveDown(): void {
    // console.log("moveDown:currentBoardIndex:BEFORE ", currentBoardIndex);
    undrawTetromino();
    // Compute tetrominoCurrentPosition before shifting down by width
    let tetrominoCurrentPosition = computeTetrominoNextPosition();
    // Shift down by width and update currentBoardIndex
    currentBoardIndex += width;
    // Compute next position using updated currentBoardIndex
    let tetrominoNextPosition = computeTetrominoNextPosition();

    if (!isValidTetrominoPosition(tetrominoNextPosition)) {
      // Freeze tetrominoCurrentPosition
      freezeTetromino(tetrominoCurrentPosition);
      // Q: Where to add the computeScore()?
      // A: Don't place here! A completed row IS valid because it
      // doesn't have 'taken'!
      // computeScore();
      initializeTetromino();
      drawUpNextTetromino();
    }

    drawTetromino();
    // Q: Invoke computeScore() here after it's been drawn?
    // This is a lot of looping....
    // A: Yea, for now seems more reasonable.
    computeScore();
  }

  function moveLeft(): void {
    undrawTetromino();
    // Define the left edge (not OOB since it's outside of the grid)
    const isAtLeftEdge: boolean = currentTetromino.some(
      (square) => (square + currentBoardIndex) % width === 0
    );

    if (!isAtLeftEdge) {
      // Decrement currentBoardIndex
      currentBoardIndex -= 1;
      // Check whether the next position shifted left by one square is valid
      let tetrominoNextPosition = computeTetrominoNextPosition();
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

  function moveRight(): void {
    undrawTetromino();
    // Define the right edge (not OOB since it's outside of the grid)
    const isAtRightEdge: boolean = currentTetromino.some(
      (square: number) => (square + currentBoardIndex + 1) % width === 0
    );

    if (!isAtRightEdge) {
      // Decrement currentBoardIndex
      currentBoardIndex += 1;
      // Check whether the next position shifted right by one square is valid
      let tetrominoNextPosition = computeTetrominoNextPosition();
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
  function initializeTetromino(): void {
    // Reset the currentBoardIndex back to 4
    currentBoardIndex = 4;
    // Init and/or update global currentTetromino
    currentTetromino = randomlySelectTetromino();
    console.log("initializeTetromino:currentTetromino: ", currentTetromino);
    // Q: Validate this initialized Tetromino here or inside moveDown?
    if (isValidTetrominoPosition(currentTetromino)) {
      console.log(
        "initializeTetromino:isValidTetrominoPosition(): ",
        isValidTetrominoPosition(currentTetromino)
      );

      let tetrominoNextPosition = computeTetrominoNextPosition();

      console.log("initializeTetromino:currentBoardIndex: ", currentBoardIndex);
      console.log(
        "initializeTetromino:tetrominoNextPosition: ",
        tetrominoNextPosition
      );
      // Check whether this is also valid after its been repositioned by currentBoardIndex
      if (isValidTetrominoPosition(tetrominoNextPosition)) {
        // Q: Draw here or inside moveDown()?
        drawTetromino();
      } else {
        console.log(
          "The randomly selected Tetromino (currentTetromino) was okay but NOT the computed tetrominoNextPosition that uses currentBoardIndex"
        );
        endGame();
      }
    } else {
      console.log(
        "The randomly selected Tetromino (currentTetromino) was NOT a valid position"
      );
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
  function toggleGame(): void {
    if (timer) {
      // Game is running so let's pause it
      clearInterval(timer);
      timer = 0;
    } else {
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
      } else {
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

  function computeScore() {
    // console.log("computeScore...");
    // Loop through all squares by ROWS (i += width)
    for (let i = 0; i < boardSize; i += width) {
      // console.log(i); // 0 10 20 ... 190
      let row = [
        i,
        i + 1,
        i + 2,
        i + 3,
        i + 4,
        i + 5,
        i + 6,
        i + 7,
        i + 8,
        i + 9,
      ];

      // console.log(row);

      // Check whether all squares in row are 'taken'
      let rowTaken: boolean = row.every((square: number) =>
        squares[square].classList.contains("taken")
      );

      if (rowTaken) {
        // console.log("Row is Taken");
        // Increase score
        score += width;
        completedRows = score / width;
        // Update scoreDisplay and rowsDisplay values
        scoreDisplay.textContent = score.toString();
        rowsDisplay.textContent = completedRows.toString();
        // Remove the 'tetromino' and 'taken' classes to clear
        row.forEach((square) =>
          squares[square].classList.remove("tetromino", "taken")
        );
        // Remove/delete the row from board using SPLICE
        let completedRowOfSquares: HTMLDivElement[] = squares.splice(i, width);
        console.log("completedRowOfSquares: ", completedRowOfSquares);
        // Q: What does squares look like now?
        // A: squares.length is now 190 but div.square190+ still visible
        // console.log("squares: ", squares);  // length = 190
        // Let's concat to revert squares Array to original length
        squares = completedRowOfSquares.concat(squares);
        // Now let's rebuild the board
        squares.forEach((square) => board.appendChild(square));
      } else {
        // console.log("Row is NOT Taken");
      }
    }
  }

  // Handler for the click event on the button
  function endGame(): void {
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
