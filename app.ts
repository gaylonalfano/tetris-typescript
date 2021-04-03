document.addEventListener("DOMContentLoaded", (e) => {
  console.group("group");
  console.log(e.type);
  console.log(e.target);
  // ===== DOM Elements
  const grid = document.querySelector(".container-grid") as HTMLDivElement;
  const board = document.querySelector(".container-board") as HTMLElement;
  const outOfBounds = Array.from(
    document.querySelectorAll(".oob") as NodeListOf<HTMLElement>
  ) as Array<HTMLElement>;
  console.log("outOfBounds: ", outOfBounds);
  // squares as Array<HTMLDivElement>
  const squaresNodeList = document.querySelectorAll(
    ".square"
  ) as NodeListOf<HTMLDivElement>;
  // const squares = Array.from(squaresNodeList); // TS2550 Error about Array.from()
  // const squares = [...squaresNodeList];  // TS2488 Error
  const squares = Array.prototype.slice.call(
    squaresNodeList
  ) as Array<HTMLDivElement>; // Or, [].slice.call()

  // Use data-* attribute to assign each div an index
  squares.forEach((square, index) => {
    square.dataset.index = index.toString();
    // Add labels to help
    square.textContent = index.toString();
  });

  const scoreDisplay = document.getElementById("score") as HTMLSpanElement;
  const startButton = document.getElementById(
    "start-button"
  ) as HTMLButtonElement;

  // ===== Game Global State
  // Grid Size
  const width = 10;
  const height = 20;
  const boardSize = width * height;

  // Global game state
  let gameIsActive: boolean = false;

  // Let's create a global currentTetromino that we can use to draw/undraw, etc.
  // NOTE Need to compute only once otherwise a new position will be computed
  // let currentTetromino = computeTetrominoGridPosition(
  //   randomlySelectTetromino(),
  //   initialBoardPosition
  // );
  let currentTetromino: number[];

  // Let's keep track of previousTetromino as well
  let previousTetromino: number[];

  // NOTE Or, I could use Arrow function to have a variable to pass around
  // let initialBoardPosition = () => Math.floor(Math.random() * (7 - 1) + 1);
  // Q: Not sure if this var is needed if I have initializeTetromino() function
  // let initialBoardPosition = computeInitialBoardPosition();
  // let tetrominoIsOutOfBounds: boolean;

  // Q: How to stop the timer?
  // A: Use clearInterval(timerId) to cancel it
  // Need a Timer to keep track and draw/undraw as Tetromino moves
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

  // ===== Define Functions
  // Static:
  // let currentTetrominoRotation = tetrominoes[0][0]; // Should match with lTetromino[0] rotation
  // console.log(currentTetrominoRotation); // [1, 11, 21, 2]
  // Random:
  function randomlySelectTetromino() {
    const randomTetromino = Math.floor(Math.random() * tetrominoes.length);
    // console.log("randomTetromino: ", randomTetromino);
    const randomRotation = Math.floor(
      Math.random() * tetrominoes[randomTetromino].length
    );
    // console.log("randomTetrominoRotation: ", randomTetrominoRotation);
    // Now let's put them together for the selectedTetrominoRotation
    const selectedTetrominoAndRotation =
      tetrominoes[randomTetromino][randomRotation];

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
  function hasOutOfBounds(tetromino: number[]): boolean {
    // Needs a Tetromino Array argument to check if any value is in OOB
    // My idea is to check whether any value (number/index) is out of board range
    // We add 'tetromino' class to draw().
    // Q: Could I just see if any value inside the array of numbers is out of
    // the range? Or, doesn't have a 'square' class?
    return tetromino.some((square) => square < 1 || square > boardSize);
  }

  // Add a function that computes whether next position has "taken" squares
  function hasTaken(tetromino: number[]) {
    return tetromino.some((square) =>
      squares[square].classList.contains("taken")
    );
  }

  // Create a helper freezeTetromino() method to freeze in place by adding class="taken"
  function freezeTetromino(tetromino: number[]) {
    // NOTE Need to redraw the tetromino as well
    tetromino.forEach((square) => {
      squares[square].classList.add("tetromino", "taken");
      console.log(
        `AFTER freezing: squares[$square].classList:`,
        squares[square].classList
      );
    });
  }

  // NOTE This could actually be computeINITIALTetrominoPosition
  // since after inits, it goes down by width until reaches bottom
  function computeTetrominoGridPosition(
    tetromino: number[],
    boardPosition: number = width
  ) {
    const nextTetrominoGridPosition = tetromino.map((square) => {
      return square + boardPosition;
    });

    // Add check that next Tetromino position won't be OOB
    if (
      hasOutOfBounds(nextTetrominoGridPosition) ||
      hasTaken(nextTetrominoGridPosition)
    ) {
      console.log("OOB || Taken! Freezing tetromino: ", tetromino);
      // NOTE Freeze the ORIGINAL tetromino, not the nextTetrominoGridPosition
      // Check the classList BEFORE freezing:
      tetromino.forEach((square) => {
        console.log(
          `BEFORE freezing: squares[$square].classList:`,
          squares[square].classList
        );
      });
      // FIXME Need to redraw to keep frozen piece visible on board. Currently
      // it gets undrawn FIRST inside moveDown() before doing this compute.
      // Probably a better way...
      // UPDATE I added the "tetromino" class along with "taken" inside freezeTetromino()
      // to reduce the loops.
      // drawTetromino(tetromino); // Added "tetromino" class inside freezeTetromino()
      freezeTetromino(tetromino);
      // Intitialize a new/next Tetromino and update global currentTetromino
      currentTetromino = initializeTetromino();
      // NOTE Do not drawTetromino() here as it is called next inside moveDown()
      return currentTetromino;
    } else {
      // Position is not OOB or Taken so we can update global currentTetromino
      currentTetromino = nextTetrominoGridPosition;

      return currentTetromino;
    }
  }

  function drawTetromino(tetromino: number[]) {
    // console.log("drawTetromino: ", tetromino);
    // Need to find matching/corresponding squares in the grid and add CSS class to each
    // Loop over the array of squares/dimensions inside currentTetrominoGridPosition
    tetromino.forEach((square) => {
      squares[square].classList.add("tetromino");
    });
  }

  // Draw initial Tetromino onto the grid/board
  // drawTetromino(currentTetromino);

  function undrawTetromino(tetromino: number[]) {
    // console.log("undrawTetromino: ", tetromino);
    tetromino.forEach((square) => {
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
    // currentTetromino = computeTetrominoGridPosition(currentTetromino). The problem is
    // inside the compute function, the var currentTetromionGridPosition still holds the
    // OLD/OOB values from the PREVIOUS Tetromino!
    // Q: Don't think I need to reset currentTetromino here since doing this inside computeTetrominoGridPosition()
    // currentTetromino = computeTetrominoGridPosition(currentTetromino);
    // Call directly and it should already update the global currentTetromino, which can
    // be used inside the next drawTetromino(currentTetromino)
    // Q: Should I use a try/catch here in case it computes to OOB?
    try {
      computeTetrominoGridPosition(currentTetromino);
      // Then draw() the Tetromino at the new Grid Position
      drawTetromino(currentTetromino);
    } catch (error) {
      console.log(error);
    }
  }

  // Need a function that initializeTetromino (not the GAME, just Tetromino)
  function initializeTetromino() {
    // Init and/or update global currentTetromino
    currentTetromino = computeTetrominoGridPosition(
      randomlySelectTetromino(),
      computeInitialBoardPosition()
    );

    return currentTetromino;

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
  }

  // Create a initializeGame() that gets everything started
  // NOTE This function is only ran once to start the game
  function initializeGame(): void {
    // Set globals
    gameIsActive = true;
    currentTetromino = initializeTetromino();
    drawTetromino(currentTetromino);
    // Initiate game timer with interval
    timer = setInterval(moveDown, 500);
  }

  initializeGame();

  // Function to stop the game and game timer
  // function freezeGame(): void {
  //   gameIsActive = false;
  //   clearInterval(timer);
  //   // Q: Do I need to reset currentTetromino, tetrominoIsOutOfBounds?
  // }
});
