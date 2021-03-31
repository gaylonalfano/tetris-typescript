document.addEventListener("DOMContentLoaded", (e) => {
  console.group("group");
  console.log(e.type);
  console.log(e.target);
  // Grid Size
  const WIDTH = 10;
  const HEIGHT = 20;
  const GRID_SIZE = WIDTH * HEIGHT;

  // DOM Elements
  const grid = document.querySelector(".grid") as HTMLDivElement;
  // squares as Array<HTMLDivElement>
  const squares = Array.from(
    document.querySelectorAll(".grid div")
  ) as HTMLDivElement[];
  // Use data-* attribute to assign each div an index
  squares.forEach((square, index) => {
    square.dataset.index = index.toString();
    // Add labels to help
    square.textContent = index.toString();
  });

  // squares as NodeListOf<HTMLDivElement>
  // const squares = document.querySelectorAll(
  //   ".grid div"
  // ) as NodeListOf<HTMLDivElement>;
  // // Use data-* attribute to assign each div an index
  // squares.forEach((square, key) => {
  //   square.dataset.index = key.toString();
  // });

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
  let initialGridPosition = Math.floor(Math.random() * (7 - 1) + 1);

  // NOTE This could actually be computeINITIALTetrominoPosition
  // since after inits, it goes down by WIDTH until reaches bottom
  function computeTetrominoGridPosition(
    tetromino: number[],
    gridPosition: number = WIDTH
  ) {
    const currentTetrominoGridPosition = tetromino.map((block) => {
      return block + gridPosition;
    });

    return currentTetrominoGridPosition;
  }

  // Let's create a global currentTetromino that we can use to draw/undraw, etc.
  // NOTE Need to compute only once otherwise a new position will be computed
  let currentTetromino = computeTetrominoGridPosition(
    randomlySelectTetromino(),
    initialGridPosition
  );

  function drawTetromino(tetromino: number[]) {
    console.log("drawTetromino: ", tetromino);
    // Need to find matching/corresponding squares in the grid and add CSS class to each
    // Loop over the array of blocks/dimensions inside currentTetrominoGridPosition
    tetromino.forEach((block) => {
      squares[block].classList.add("tetromino");
    });
  }

  drawTetromino(currentTetromino);

  function undrawTetromino(tetromino: number[]) {
    console.log("undrawTetromino: ", tetromino);
    tetromino.forEach((block) => {
      squares[block].classList.remove("tetromino");
    });
  }

  //setTimeout(() => undrawTetromino(currentTetromino), 3000); // works

  // Need a Timer to keep track and draw/undraw as Tetromino moves
  const timerId = setInterval(moveDown, 1000);

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
