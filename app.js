document.addEventListener("DOMContentLoaded", function (e) {
    console.group("group");
    console.log(e.type);
    console.log(e.target);
    // Grid Size
    var WIDTH = 10;
    var HEIGHT = 20;
    var GRID_SIZE = WIDTH * HEIGHT;
    // DOM Elements
    var grid = document.querySelector(".grid");
    // squares as Array<HTMLDivElement>
    var squares = Array.from(document.querySelectorAll(".grid div"));
    // Use data-* attribute to assign each div an index
    squares.forEach(function (square, index) {
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
    var scoreDisplay = document.getElementById("score");
    var startButton = document.getElementById("start-button");
    // ===== Let's define the dimensions of our grid and Tetrominoes
    // NOTE We have a 10x20 Grid (200 divs) that wrap
    // NOTE Check the file 'Tetrominos' in this project folder
    // === "L" Tetromino rotations
    var lTetromino = [
        // An Array for each position
        [1, WIDTH + 1, WIDTH * 2 + 1, 2],
        [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH * 2 + 2],
        [1, WIDTH + 1, WIDTH * 2 + 1, WIDTH * 2],
        [WIDTH, WIDTH * 2, WIDTH * 2 + 1, WIDTH * 2 + 2],
    ];
    var zTetromino = [
        // Only has 2 unique rotations/positions so duplicate
        [WIDTH * 2, WIDTH * 2 + 1, WIDTH + 1, WIDTH + 2],
        [0, WIDTH, WIDTH + 1, WIDTH * 2 + 1],
        [WIDTH * 2, WIDTH * 2 + 1, WIDTH + 1, WIDTH + 2],
        [0, WIDTH, WIDTH + 1, WIDTH * 2 + 1],
    ];
    var tTetromino = [
        [1, WIDTH, WIDTH + 1, WIDTH + 2],
        [1, WIDTH + 1, WIDTH * 2 + 1, WIDTH + 2],
        [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH * 2 + 1],
        [WIDTH, 1, WIDTH + 1, WIDTH * 2 + 1],
    ];
    var oTetromino = [
        [0, 1, WIDTH, WIDTH + 1],
        [0, 1, WIDTH, WIDTH + 1],
        [0, 1, WIDTH, WIDTH + 1],
        [0, 1, WIDTH, WIDTH + 1],
    ];
    var iTetromino = [
        [1, WIDTH + 1, WIDTH * 2 + 1, WIDTH * 3 + 1],
        [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH + 3],
        [1, WIDTH + 1, WIDTH * 2 + 1, WIDTH * 3 + 1],
        [WIDTH, WIDTH + 1, WIDTH + 2, WIDTH + 3],
    ];
    var tetrominoes = [
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
        var randomTetromino = Math.floor(Math.random() * tetrominoes.length);
        // console.log("randomTetromino: ", randomTetromino);
        var randomRotation = Math.floor(Math.random() * tetrominoes[randomTetromino].length);
        // console.log("randomTetrominoRotation: ", randomTetrominoRotation);
        // Now let's put them together for the selectedTetrominoRotation
        var selectedTetrominoAndRotation = tetrominoes[randomTetromino][randomRotation];
        return selectedTetrominoAndRotation;
    }
    function computeTetrominoGridPosition(tetromino) {
        // Randomly select a currentPosition on the Grid
        //const currentGridPosition = Math.floor(Math.random() * squares.length);
        // TODO Account for grid edges so they don't wrap or go off screen
        // Random number in range: https://stackoverflow.com/a/1527820/9901949
        var currentGridPosition = Math.floor(Math.random() * (8 - 1) + 1);
        var currentTetrominoGridPosition = tetromino.map(function (block) {
            return block + currentGridPosition;
        });
        return currentTetrominoGridPosition;
    }
    // Let's create a global currentTetromino that we can use to draw/undraw, etc.
    // NOTE Need to compute only once otherwise a new position will be computed
    var currentTetromino = computeTetrominoGridPosition(randomlySelectTetromino());
    function drawTetromino(tetromino) {
        console.log("drawTetromino: ", tetromino);
        // Need to find matching/corresponding squares in the grid and add CSS class to each
        // Loop over the array of blocks/dimensions inside currentTetrominoGridPosition
        tetromino.forEach(function (block) {
            squares[block].classList.add("tetromino");
        });
    }
    drawTetromino(currentTetromino);
    // function undrawTetromino() {
    //   const currentTetrominoGridPosition = computeTetrominoGridPosition(
    //     currentTetromino
    //   );
    //   currentTetrominoGridPosition.forEach((block) => {
    //     squares[block].classList.remove("tetromino");
    //   });
    // }
    // setTimeout(undrawTetromino, 5000);
});
