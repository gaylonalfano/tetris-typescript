document.addEventListener("DOMContentLoaded", (e) => {
  console.group("group");
  console.log(e.type);
  console.log(e.target);
  // Grid Size
  const WIDTH = 10;
  const HEIGHT = 20;
  const BOARD_SIZE = WIDTH * HEIGHT;

  // DOM Elements
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

  // ===== Let's define the dimensions of our grid and Tetrominoes
  // NOTE We have a 10x20 Grid (200 divs) that wrap
  // NOTE Check the file 'Tetrominos' in this project folder
  // === "L" Tetromino rotations
  const lTetromino: Array<number[]> = [
    // An Array for each position
    [1, WIDTH + 1, WIDTH * 2 + 1, 2],
    [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH * 2 + 2],
    [1, WIDTH + 1, WIDTH * 2 + 1, WIDTH * 2],
    [WIDTH, WIDTH * 2, WIDTH * 2 + 1, WIDTH * 2 + 2],
  ];

  const zTetromino: Array<number[]> = [
    // Only has 2 unique rotations/positions so duplicate
    [WIDTH * 2, WIDTH * 2 + 1, WIDTH + 1, WIDTH + 2],
    [0, WIDTH, WIDTH + 1, WIDTH * 2 + 1],
    [WIDTH * 2, WIDTH * 2 + 1, WIDTH + 1, WIDTH + 2],
    [0, WIDTH, WIDTH + 1, WIDTH * 2 + 1],
  ];

  const tTetromino: Array<number[]> = [
    [1, WIDTH, WIDTH + 1, WIDTH + 2],
    [1, WIDTH + 1, WIDTH * 2 + 1, WIDTH + 2],
    [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH * 2 + 1],
    [WIDTH, 1, WIDTH + 1, WIDTH * 2 + 1],
  ];

  const oTetromino: Array<number[]> = [
    [0, 1, WIDTH, WIDTH + 1],
    [0, 1, WIDTH, WIDTH + 1],
    [0, 1, WIDTH, WIDTH + 1],
    [0, 1, WIDTH, WIDTH + 1],
  ];

  const iTetromino: Array<number[]> = [
    [1, WIDTH + 1, WIDTH * 2 + 1, WIDTH * 3 + 1],
    [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH + 3],
    [1, WIDTH + 1, WIDTH * 2 + 1, WIDTH * 3 + 1],
    [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH + 3],
  ];

  const tetrominoes = [
    lTetromino,
    zTetromino,
    tTetromino,
    oTetromino,
    iTetromino,
  ];

  // === Randomly select a Tetromino and a random rotation
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
  let initialBoardPosition = Math.floor(Math.random() * (7 - 1) + 1);
  let tetrominoIsOutOfBounds: boolean;

  // Add a function that computes whether in Out-of-bounds
  function isOutOfBounds(tetromino: number[]): boolean {
    // Needs a Tetromino Array argument to check if any value is in OOB
    // My idea is to check whether any value (number/index) is out of board range
    // We add 'tetromino' class to draw().
    // Q: Could I just see if any value inside the array of numbers is out of
    // the range? Or, doesn't have a 'square' class?
    tetrominoIsOutOfBounds = tetromino.some(
      (square) => square < 1 || square > BOARD_SIZE
    );
    return tetrominoIsOutOfBounds;
  }

  // TODO Create a helper freeze() method to stop game
  function freeze() {}

  // NOTE This could actually be computeINITIALTetrominoPosition
  // since after inits, it goes down by WIDTH until reaches bottom
  function computeTetrominoGridPosition(
    tetromino: number[],
    boardPosition: number = WIDTH
  ) {
    const currentTetrominoGridPosition = tetromino.map((block) => {
      return block + boardPosition;
    });

    // Add check that Tetromino won't be OOB
    if (isOutOfBounds(currentTetrominoGridPosition)) {
      console.log("tetrominoIsOutOfBounds: ", tetrominoIsOutOfBounds);
      alert("OOB!");
      // Stop execution
      // TODO Need to make an type Tetromino { number[] | undefined }??
      // return;
    }

    return currentTetrominoGridPosition;
  }

  // Let's create a global currentTetromino that we can use to draw/undraw, etc.
  // NOTE Need to compute only once otherwise a new position will be computed
  let currentTetromino = computeTetrominoGridPosition(
    randomlySelectTetromino(),
    initialBoardPosition
  );

  function drawTetromino(tetromino: number[]) {
    console.log("drawTetromino: ", tetromino);
    // Need to find matching/corresponding squares in the grid and add CSS class to each
    // Loop over the array of blocks/dimensions inside currentTetrominoGridPosition
    tetromino.forEach((block) => {
      squares[block].classList.add("tetromino");
    });
  }

  // Draw initial Tetromino onto the grid/board
  drawTetromino(currentTetromino);

  function undrawTetromino(tetromino: number[]) {
    console.log("undrawTetromino: ", tetromino);
    tetromino.forEach((block) => {
      squares[block].classList.remove("tetromino");
    });
  }

  //setTimeout(() => undrawTetromino(currentTetromino), 3000); // works

  // Need a Timer to keep track and draw/undraw as Tetromino moves
  // const timerId = setInterval(moveDown, 500);
  const timerId = setInterval(() => {
    if (!tetrominoIsOutOfBounds) {
      moveDown();
    }
  }, 500);

  function moveDown() {
    // Needs to take currentTetromino Grid Position and undraw() it
    undrawTetromino(currentTetromino);
    // Then recompute the new updated Grid Position (shift down by WIDTH)
    // currentTetromino = currentTetromino.map((block) => block + WIDTH);
    // NOTE gripPosition arg is optional (default is WIDTH)
    currentTetromino = computeTetrominoGridPosition(currentTetromino);

    // FAILED ATTEMPTS
    // console.log("cgp BEFORE: ", currentGridPosition);
    // currentGridPosition += WIDTH; // works
    // console.log("cgp AFTER: ", currentGridPosition);

    // Recompute currentTetromionGridPosition w/ updated currentGridPosition
    // console.log("ct BEFORE: ", currentTetromino);
    // let updatedTetrominoGridPosition = computeTetrominoGridPosition(
    //   currentTetromino,
    //   currentGridPosition
    // );
    // console.log("ct AFTER: ", currentTetromino);
    // console.log("ut AFTER: ", updatedTetrominoGridPosition);
    // // Update our currentTetromino values
    // currentTetromino = updatedTetrominoGridPosition;
    // console.log(
    //   "currentTetromino AFTER setting to updatedTetrominoGridPosition, ",
    //   currentTetromino
    // );

    // Then draw() the Tetromino at the new Grid Position
    drawTetromino(currentTetromino);
  }
});
