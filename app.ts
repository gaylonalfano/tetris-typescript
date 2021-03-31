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
  // const squares = Array.from(
  //   document.querySelectorAll(".grid div")
  // ) as HTMLDivElement[];
  // console.log(squares);
  const squares = document.querySelectorAll(
    ".grid div"
  ) as NodeListOf<HTMLDivElement>;
  // Use data-* attribute to assign each div an index
  squares.forEach((square, key) => {
    square.dataset.index = key.toString();
  });

  const scoreDisplay = document.getElementById("score") as HTMLSpanElement;
  const startButton = document.getElementById(
    "start-button"
  ) as HTMLButtonElement;

  // Helper add square labels
  squares.forEach((s, i) => {
    s.textContent = i.toString();
  });

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

  // === Randomly select a currentPosition on the Grid
  let currentGridPosition = Math.floor(Math.random() * squares.length);

  // === Randomly select a Tetromino and a random rotation
  // Static:
  // let currentTetrominoRotation = tetrominoes[0][0]; // Should match with lTetromino[0] rotation
  // console.log(currentTetrominoRotation); // [1, 11, 21, 2]
  // Random:
  function randomlySelectTetromino() {
    const randomTetromino = Math.floor(Math.random() * tetrominoes.length);
    console.log("randomTetromino: ", randomTetromino);
    const randomTetrominoRotation = Math.floor(
      Math.random() * tetrominoes[randomTetromino].length
    );
    console.log("randomTetrominoRotation: ", randomTetrominoRotation);
    // Now let's put them together for the currentTetrominoRotation
    const currentTetrominoRotation =
      tetrominoes[randomTetromino][randomTetrominoRotation];

    const currentTetrominoGridPosition = currentTetrominoRotation.map(
      (block) => {
        return block + currentGridPosition;
      }
    );
    console.log(currentTetrominoGridPosition);
  }

  // // Let's put this into a function and add a CSS class of 'tetromino' to give color
  // function drawTetromino() {
  //   // Need to find matching/corresponding squares in the grid and add CSS class to each
  //   // Loop over the array of blocks/dimensions inside currentTetrominoGridPosition
  //   currentTetrominoGridPosition.forEach((block) => {
  //     squares[block].classList.add("tetromino");
  //   });
  // }

  // Invoke
  //drawTetromino();
});
