const btnSolvePause = document.getElementById("btn-solve-pause");
const btnSolveResult = document.getElementById("btn-solve-result");
const screenStart = document.getElementById("screen-start");
const screenMode = document.getElementById("screen-mode");
const screenApp = document.getElementById("screen-app");
const btnStart = document.getElementById("btn-start");
const btnModePlay = document.getElementById("btn-mode-play");
const btnModeSolve = document.getElementById("btn-mode-solve");
const btnBackMode = document.getElementById("btn-back-mode");
const appTitle = document.getElementById("app-title");
const boardDesc = document.getElementById("board-desc");
const statusElement = document.getElementById("status");
const boardElement = document.getElementById("sudoku-board");
const playControls = document.getElementById("play-controls");
const solveControls = document.getElementById("solve-controls");
const playHintsLabel = document.getElementById("play-hints");
const playMistakesLabel = document.getElementById("play-mistakes");
const btnPlayHint = document.getElementById("btn-play-hint");
const btnSolveAuto = document.getElementById("btn-solve-auto");
const btnSolveVisual = document.getElementById("btn-solve-visual");
const gameOverPanel = document.getElementById("game-over");
const btnOverRetry = document.getElementById("btn-over-retry");
const btnOverRandom = document.getElementById("btn-over-random");
const btnOverExit = document.getElementById("btn-over-exit");
let currentMode = null;
let currentLevel = null;            
let currentPuzzleIndex = null;      
let currentPuzzleBoard = null;    
const gameState = {
    active: false,
    solutionBoard: null,
    hintsUsed: 0,
    maxHints: 3,
    mistakes: 0,
    maxMistakes: 3
};


let isAnimating = false;
let visualState = {
    steps: [],
    index: 0,
    solution: null,
    prevInput: null,
    isPaused: false,
    active: false
};


function visualStepRunner() {
    if (!isAnimating || !visualState.active) return;
    if (visualState.isPaused) return;
    const steps = visualState.steps;
    const i = visualState.index;
    if (visualState.prevInput) {
        visualState.prevInput.classList.remove("animate-step");
    }
    if (i >= steps.length) {
        isAnimating = false;
        visualState.active = false;
        statusElement.textContent =
            "Đã minh hoạ xong dòng đầu tiên. Bạn có thể nhấn 'Kết quả' để xem đáp án.";
        return;
    }
    const s = steps[i];
    const input = getInputAt(s.r, s.c);
    if (s.action === "set") {
        input.value = s.num;
        input.classList.remove("wrong");
        input.classList.add("solution", "colored");
        input.style.color = colorForValue(s.num);
    } else {
        input.value = "";
        input.style.color = "";
        input.classList.remove("solution", "colored");
    }
    input.classList.add("animate-step");
    visualState.prevInput = input;
    visualState.index++;
    setTimeout(visualStepRunner, 350);
}
function deepCopyBoard(board) {
    return board.map(row => row.slice());
}


function createBoardUI() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement("div");
            cell.classList.add("sudoku-cell");
            if ((c + 1) % 3 === 0 && c !== 8) {
                cell.classList.add("block-right");
            }
            if ((r + 1) % 3 === 0 && r !== 8) {
                cell.classList.add("block-bottom");
            }
            const input = document.createElement("input");
            input.type = "text";
            input.maxLength = 1;
            input.classList.add("sudoku-input");
            input.dataset.row = r;
            input.dataset.col = c;
            input.addEventListener("input", onCellInput);
            cell.appendChild(input);
            boardElement.appendChild(cell);
        }
    }
}


function getInputAt(r, c) {
    return boardElement.querySelector(
        `.sudoku-input[data-row="${r}"][data-col="${c}"]`
    );
}
function getBoardFromUI() {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    const inputs = boardElement.querySelectorAll(".sudoku-input");
    inputs.forEach(input => {
        const r = Number(input.dataset.row);
        const c = Number(input.dataset.col);
        const v = input.value.trim();
        board[r][c] = v === "" ? 0 : Number(v);
    });
    return board;
}


function isSafe(board, row, col, num) {
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }
    for (let y = 0; y < 9; y++) {
        if (board[y][col] === num) return false;
    }
    const sr = row - (row % 3);
    const sc = col - (col % 3);
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[sr + r][sc + c] === num) return false;
        }
    }
    return true;
}


function findEmptyCell(board) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) return { r, c };
        }
    }
    return null;
}
function solveBoard(board) {
    const b = deepCopyBoard(board);
    function backtrack() {
        const empty = findEmptyCell(b);
        if (!empty) return true;
        const { r, c } = empty;
        for (let num = 1; num <= 9; num++) {
            if (isSafe(b, r, c, num)) {
                b[r][c] = num;
                if (backtrack()) return true;
                b[r][c] = 0;
            }
        }
        return false;
    }
    const ok = backtrack();
    return { ok, solution: ok ? b : null };
}
function solveWithStepLog(puzzleBoard, maxSteps = 20) {
    const b = deepCopyBoard(puzzleBoard);
    const steps = [];
    function backtrack() {
        const empty = findEmptyCell(b);
        if (!empty) return true;
        const { r, c } = empty;
        for (let num = 1; num <= 9; num++) {
            if (isSafe(b, r, c, num)) {
                b[r][c] = num;
                if (steps.length < maxSteps) {
                    steps.push({ action: "set", r, c, num });
                }
                if (backtrack()) return true;
                if (steps.length < maxSteps) {
                    steps.push({ action: "unset", r, c, num });
                }
                b[r][c] = 0;
            }
        }
        return false;
    }
    const ok = backtrack();
    return { ok, solution: ok ? b : null, steps };
}
function isInitialBoardValid(board) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const v = board[r][c];
            if (v !== 0) {
                board[r][c] = 0;
                if (!isSafe(board, r, c, v)) {
                    board[r][c] = v;
                    return { ok: false, row: r, col: c, value: v };
                }
                board[r][c] = v;
            }
        }
    }
    return { ok: true };
}
function isBoardFilled(board) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) return false;
        }
    }
    return true;
}


function isBoardValidFull(board) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const v = board[r][c];
            if (v === 0) return false;
            board[r][c] = 0;
            if (!isSafe(board, r, c, v)) {
                board[r][c] = v;
                return false;
            }
            board[r][c] = v;
        }
    }
    return true;
}


function boardsEqual(b1, b2) {
    if (!b1 || !b2) return false;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (b1[r][c] !== b2[r][c]) return false;
        }
    }
    return true;
}
const puzzleSets = {
    easy: [
    [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ],
    [
        [0, 0, 3, 0, 2, 0, 6, 0, 0],
        [9, 0, 0, 3, 0, 5, 0, 0, 1],
        [0, 0, 1, 8, 0, 6, 4, 0, 0],
        [0, 0, 8, 1, 0, 2, 9, 0, 0],
        [7, 0, 0, 0, 0, 0, 0, 0, 8],
        [0, 0, 6, 7, 0, 8, 2, 0, 0],
        [0, 0, 2, 6, 0, 9, 5, 0, 0],
        [8, 0, 0, 2, 0, 3, 0, 0, 9],
        [0, 0, 5, 0, 1, 0, 3, 0, 0]
    ],
    [
        [2, 0, 0, 0, 8, 0, 3, 0, 0],
        [0, 6, 0, 0, 7, 0, 0, 8, 4],
        [0, 3, 0, 5, 0, 0, 2, 0, 9],
        [0, 0, 0, 1, 0, 5, 4, 0, 8],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [4, 0, 2, 7, 0, 6, 0, 0, 0],
        [3, 0, 1, 0, 0, 7, 0, 4, 0],
        [7, 2, 0, 0, 4, 0, 0, 6, 0],
        [0, 0, 4, 0, 1, 0, 0, 0, 3]
    ]
],
    medium: [  
    [
        [0, 2, 0, 6, 0, 8, 0, 0, 0],
        [5, 8, 0, 0, 0, 9, 7, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 0],
        [3, 7, 0, 0, 0, 0, 5, 0, 0],
        [6, 0, 0, 0, 0, 0, 0, 0, 4],
        [0, 0, 8, 0, 0, 0, 0, 1, 3],
        [0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 9, 8, 0, 0, 0, 3, 6],
        [0, 0, 0, 3, 0, 6, 0, 9, 0]
],
    [
        [0, 0, 0, 2, 6, 0, 7, 0, 1],
        [6, 8, 0, 0, 7, 0, 0, 9, 0],
        [1, 9, 0, 0, 0, 4, 5, 0, 0],
        [8, 2, 0, 1, 0, 0, 0, 4, 0],
        [0, 0, 4, 6, 0, 2, 9, 0, 0],
        [0, 5, 0, 0, 0, 3, 0, 2, 8],
        [0, 0, 9, 3, 0, 0, 0, 7, 4],
        [0, 4, 0, 0, 5, 0, 0, 3, 6],
        [7, 0, 3, 0, 1, 8, 0, 0, 0]
    ],
    [
        [0, 2, 4, 3, 8, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 6, 0, 0, 7],
        [0, 5, 8, 0, 0, 0, 4, 0, 0],
        [4, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 7, 0, 5, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 8],
        [0, 0, 1, 0, 0, 0, 6, 7, 0],
        [3, 0, 0, 5, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 4, 9, 2, 1, 0]
    ]
],
    hard: [
    [
        [0, 0, 0, 0, 0, 0, 6, 8, 0],
        [0, 0, 0, 0, 7, 3, 0, 0, 9],
        [3, 0, 9, 0, 0, 0, 0, 4, 5],
        [4, 9, 0, 0, 0, 0, 0, 0, 0],
        [8, 0, 3, 0, 5, 0, 9, 0, 2],
        [0, 0, 0, 0, 0, 0, 0, 3, 6],
        [9, 6, 0, 0, 0, 0, 3, 0, 8],
        [7, 0, 0, 6, 8, 0, 0, 0, 0],
        [0, 2, 8, 0, 0, 0, 0, 0, 0]
    ],
    [
        [4, 0, 0, 0, 0, 0, 8, 0, 5],
        [0, 3, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 7, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 0, 6, 0],
        [0, 0, 0, 0, 8, 0, 4, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 6, 0, 3, 0, 7, 0],
        [5, 0, 0, 2, 0, 0, 0, 0, 0],
        [1, 0, 4, 0, 0, 0, 0, 0, 0]
    ],
    [
        [8, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 3, 6, 0, 0, 0, 0, 0],
        [0, 7, 0, 0, 9, 0, 2, 0, 0],
        [0, 5, 0, 0, 0, 7, 0, 0, 0],
        [0, 0, 0, 0, 4, 5, 7, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 3, 0],
        [0, 0, 1, 0, 0, 0, 0, 6, 8],
        [0, 0, 8, 5, 0, 0, 0, 1, 0],
        [0, 9, 0, 0, 0, 0, 4, 0, 0]
    ]
],
};




function choosePuzzle(level, avoidIndex = null) {
    const list = puzzleSets[level];
    if (!list || list.length === 0) return null;
    let idx;
    if (list.length === 1) {
        idx = 0;
    } else {
        do {
            idx = Math.floor(Math.random() * list.length);
        } while (idx === avoidIndex);
    }
    currentLevel = level;
    currentPuzzleIndex = idx;
    currentPuzzleBoard = deepCopyBoard(list[idx]);
    return currentPuzzleBoard;
}
function clearAllCells() {
    const inputs = boardElement.querySelectorAll(".sudoku-input");
    inputs.forEach(input => {
        input.value = "";
        input.classList.remove(
            "given",
            "given-solve",  
            "solution",
            "user",
            "wrong",
            "animate-step",
            "colored"        
        );
        input.readOnly = false;
        input.style.color = "";
    });
}
function renderPuzzleForPlay() {
    clearAllCells();
    boardElement.classList.remove("disabled");


    if (!currentPuzzleBoard) return;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const input = getInputAt(r, c);
            const val = currentPuzzleBoard[r][c];
            if (val !== 0) {
                input.value = val;
                input.classList.add("given");
                input.readOnly = true;
            } else {
                input.value = "";
                input.classList.add("user");
                input.readOnly = false;
            }
        }
    }
}
function renderPuzzleForSolve() {
    clearAllCells();
    boardElement.classList.remove("disabled");


    if (!currentPuzzleBoard) return;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const input = getInputAt(r, c);
            const val = currentPuzzleBoard[r][c];
            if (val !== 0) {
                input.value = val;
                input.readOnly = true;
                input.classList.add("given", "colored", "given-solve");
                input.style.color = colorForValue(val);
            } else {
                input.value = "";
                input.readOnly = true;
            }
        }
    }
}
function resetVisualState() {
    isAnimating = false;
    visualState.steps = [];
    visualState.index = 0;
    visualState.solution = null;
    visualState.prevInput = null;
    visualState.isPaused = false;
    visualState.active = false;
    btnSolvePause.textContent = "Dừng";
}
function renderSolution(solutionBoard) {
    clearAllCells();
    boardElement.classList.remove("disabled");
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const input = getInputAt(r, c);
            const puzzleVal = currentPuzzleBoard[r][c];
            const val = solutionBoard[r][c];
            input.value = val;
            input.readOnly = true;
            if (puzzleVal !== 0) {
                input.classList.add("given", "colored", "given-solve");
                input.style.color = colorForValue(val);
            } else {
                input.classList.add("solution", "colored");
                input.classList.add("solution");
                 input.style.color = colorForValue(val);




            }
        }
    }
}
function setBoardDisabled(disabled) {
    if (disabled) boardElement.classList.add("disabled");
    else boardElement.classList.remove("disabled");
}
function updatePlayLabels() {
    playHintsLabel.textContent = `Hint: ${gameState.hintsUsed} / ${gameState.maxHints}`;
    playMistakesLabel.textContent = `Sai: ${gameState.mistakes} / ${gameState.maxMistakes}`;
}
function resetPlayState() {
    gameState.active = false;
    gameState.solutionBoard = null;
    gameState.hintsUsed = 0;
    gameState.mistakes = 0;
    updatePlayLabels();
    gameOverPanel.classList.add("hidden");
    setBoardDisabled(false);
}
function onCellInput(e) {
    if (isAnimating) {
        e.target.value = "";
        return;
    }


    if (currentMode === "play") handlePlayInput(e);
    else {
        e.target.value = "";
    }
}


function handlePlayInput(e) {
    if (!gameState.active) {
        e.target.value = "";
        statusElement.textContent = "Hãy chọn mức độ để bắt đầu một ván TỰ CHƠI.";
        return;
    }
    if (gameState.mistakes >= gameState.maxMistakes) {
        e.target.value = "";
        return;
    }
    const input = e.target;
    const r = Number(input.dataset.row);
    const c = Number(input.dataset.col);


    if (currentPuzzleBoard && currentPuzzleBoard[r][c] !== 0) {
        input.value = currentPuzzleBoard[r][c];
        return;
    }
    input.classList.remove("wrong", "animate-step", "flash-correct");
    input.style.color = "";
    const vStr = input.value.trim();
    if (vStr === "") {
        statusElement.textContent = `Đã xoá ô (${r + 1}, ${c + 1}).`;
        return;
    }
    if (!/^[1-9]$/.test(vStr)) {
        input.value = "";
        return;
    }
    const val = Number(vStr);
    if (gameState.solutionBoard) {
        const correctVal = gameState.solutionBoard[r][c];
        if (val !== correctVal) {
        gameState.mistakes++;
        updatePlayLabels();
        input.classList.add("wrong");
        statusElement.textContent =
            `SAI! Giá trị bạn nhập tại ô (${r + 1}, ${c + 1}) không đúng đáp án.`;
        if (gameState.mistakes >= gameState.maxMistakes) {
            statusElement.textContent += " Bạn đã sai 3 lần, GAME OVER.";
            gameOverPanel.classList.remove("hidden");
            gameState.active = false;
            setBoardDisabled(true);
        }
        return;
    }
        input.classList.remove("wrong");
        input.classList.add("user");
        statusElement.textContent =
            `Đã đặt đúng số ${val} vào ô (${r + 1}, ${c + 1}).`;
        input.classList.add("flash-correct");
        setTimeout(() => {
            input.classList.remove("flash-correct");
        }, 450);
        const currentBoard = getBoardFromUI();
        if (boardsEqual(currentBoard, gameState.solutionBoard)) {
            statusElement.textContent =
                ">>> CHÚC MỪNG! Bạn đã giải đúng toàn bộ Sudoku (khớp với lời giải).";
            gameState.active = false;
        }
        return;
    }
    const board = getBoardFromUI();
    board[r][c] = 0;
    if (!isSafe(board, r, c, val)) {
        gameState.mistakes++;
        updatePlayLabels();
        input.classList.add("wrong");
        statusElement.textContent =
            `SAI! Không thể đặt ${val} vào ô (${r + 1}, ${c + 1}) (vi phạm luật Sudoku).`;
        if (gameState.mistakes >= gameState.maxMistakes) {
            statusElement.textContent += " Bạn đã sai 3 lần, GAME OVER.";
            gameOverPanel.classList.remove("hidden");
            gameState.active = false;
            setBoardDisabled(true);
        }
        return;
    }


    input.classList.remove("wrong");
    input.classList.add("user");
    statusElement.textContent =
        `Đã đặt ${val} vào ô (${r + 1}, ${c + 1}).`;
    const newBoard = getBoardFromUI();
    if (isBoardFilled(newBoard)) {
        if (isBoardValidFull(newBoard)) {
            statusElement.textContent =
                ">>> CHÚC MỪNG! Bạn đã giải đúng toàn bộ Sudoku.";
            gameState.active = false;
        } else {
            statusElement.textContent =
                "Bảng đã đầy nhưng vẫn còn lỗi vi phạm luật Sudoku.";
        }
    }
}
function handlePlayHintClick() {
    if (!gameState.active) {
        statusElement.textContent =
            "Hãy chọn mức độ và bắt đầu ván TỰ CHƠI trước khi dùng Hint.";
        return;
    }
    if (!gameState.solutionBoard) {
        statusElement.textContent = "Không có lời giải để gợi ý.";
        return;
    }
    if (gameState.hintsUsed >= gameState.maxHints) {
        statusElement.textContent = "Bạn đã dùng hết 3 Hint trong lượt này.";
        return;
    }
    const board = getBoardFromUI();
    const empties = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) empties.push({ r, c });
        }
    }
    if (empties.length === 0) {
        statusElement.textContent = "Không còn ô trống để gợi ý.";
        return;
    }
    const picked = empties[Math.floor(Math.random() * empties.length)];
    const { r, c } = picked;
    const val = gameState.solutionBoard[r][c];
    const input = getInputAt(r, c);
    input.value = val;
    input.classList.remove("wrong");
    input.classList.add("user");
    input.style.color = "";
    gameState.hintsUsed++;
    updatePlayLabels();
    statusElement.textContent =
        `Hint: đặt đúng số ${val} vào ô (${r + 1}, ${c + 1}).`;
}
function handleSolveAuto() {
    isAnimating = false;
    visualState.active = false;
    visualState.isPaused = false;
    if (!currentPuzzleBoard) {
        statusElement.textContent = "Hãy chọn mức độ trong chế độ MÁY GIẢI.";
        return;
    }
    const board = deepCopyBoard(currentPuzzleBoard);
    const check = isInitialBoardValid(board);
    if (!check.ok) {
        statusElement.textContent =
            `Đề không hợp lệ: số ${check.value} tại ô (${check.row + 1}, ${check.col + 1}) vi phạm luật Sudoku.`;
        return;
    }
    const result = solveBoard(board);
    if (!result.ok) {
        statusElement.textContent = "Không tìm được nghiệm phù hợp cho đề này.";
        return;
    }
    renderSolution(result.solution);
    statusElement.textContent =
        "Máy đã giải xong Sudoku. Số đề gốc và số máy điền có màu khác nhau.";
}
const valueColors = [
    "#f97373", "#fbbf24", "#4ade80",
    "#22d3ee", "#a855f7", "#f472b6",
    "#38bdf8", "#facc15", "#2dd4bf"
];


function colorForValue(num) {
    if (num < 1 || num > 9) return "#e5e7eb";
    return valueColors[num - 1];
}


function handleSolveVisual() {
    if (!currentPuzzleBoard) {
        statusElement.textContent = "Hãy chọn mức độ trong chế độ MÁY GIẢI.";
        return;
    }
    if (isAnimating) return;
    const board = deepCopyBoard(currentPuzzleBoard);
    const check = isInitialBoardValid(board);
    if (!check.ok) {
        statusElement.textContent =
            `Đề không hợp lệ: số ${check.value} tại ô (${check.row + 1}, ${check.col + 1}) vi phạm luật Sudoku.`;
        return;
    }
    const { ok, solution, steps } = solveWithStepLog(currentPuzzleBoard, 20);
    if (!ok || !solution) {
        statusElement.textContent = "Không tìm được nghiệm để minh hoạ.";
        return;
    }
    visualState.steps = steps;
    visualState.index = 0;
    visualState.solution = solution;
    visualState.prevInput = null;
    visualState.isPaused = false;
    visualState.active = true;
    isAnimating = true;
    btnSolvePause.textContent = "Dừng";
    statusElement.textContent =
        "Đang minh hoạ 20 bước đầu tiên của thuật toán backtracking...";
    renderPuzzleForSolve();
    visualStepRunner();
}
function handleSolvePause() {
    if (!visualState.active) return;
    visualState.isPaused = !visualState.isPaused;
    btnSolvePause.textContent = visualState.isPaused ? "Tiếp tục" : "Dừng";


    if (!visualState.isPaused) {
        statusElement.textContent =
            "Tiếp tục minh hoạ backtracking trên dòng đầu tiên...";
        visualStepRunner();
    } else {
        statusElement.textContent = "Đang tạm dừng minh hoạ. Nhấn 'Tiếp tục' để chạy tiếp.";
    }
}
function handleSolveShowResult() {
    if (!currentPuzzleBoard) {
        statusElement.textContent =
            "Hãy chọn mức độ trong chế độ MÁY GIẢI trước.";
        return;
    }
    const { ok, solution } = solveBoard(currentPuzzleBoard);
    if (!ok || !solution) {
        statusElement.textContent = "Không tìm được nghiệm để hiển thị kết quả.";
        return;
    }
    visualState.solution = solution;
    isAnimating = false;
    visualState.active = false;
    visualState.isPaused = false;
    if (visualState.prevInput) {
        visualState.prevInput.classList.remove("animate-step");
    }
    renderSolution(solution);
    statusElement.textContent =
        "Đã hiển thị đáp án cho đúng đề hiện tại.";
}
function handleGameOverRetry() {
    if (!currentLevel || currentPuzzleIndex === null) return;
    resetPlayState();
    choosePuzzle(currentLevel, null);
    const { ok, solution } = solveBoard(currentPuzzleBoard);
    if (!ok) {
        statusElement.textContent = "Đề hiện tại không có nghiệm.";
        return;
    }
    gameState.solutionBoard = solution;
    gameState.active = true;
    renderPuzzleForPlay();
    statusElement.textContent =
        "Đã chơi lại đề cũ. Bạn có 3 lần sai và 3 Hint.";
}


function handleGameOverRandom() {
    if (!currentLevel) return;
    resetPlayState();
    choosePuzzle(currentLevel, currentPuzzleIndex);
    const { ok, solution } = solveBoard(currentPuzzleBoard);
    if (!ok) {
        statusElement.textContent = "Đề mới không có nghiệm.";
        return;
    }
    gameState.solutionBoard = solution;
    gameState.active = true;
    renderPuzzleForPlay();
    statusElement.textContent =
        "Đã random đề mới. Bạn có 3 lần sai và 3 Hint.";
}
function handleGameOverExit() {
    resetPlayState();
    clearAllCells();
    setBoardDisabled(false);
    gameOverPanel.classList.add("hidden");
    showScreen("mode");
    statusElement.textContent =
        "Bạn đã thoát game Tự chơi. Hãy chọn chế độ tiếp theo.";
}
function handleDifficultyClick(level) {
    if (isAnimating) return;
    resetVisualState();
    if (currentMode === "play") {
        resetPlayState();
        const board = choosePuzzle(level, null);
        if (!board) {
            statusElement.textContent = "Hiện không có đề cho mức độ này.";
            return;
        }
        const res = solveBoard(board);
        if (!res.ok) {
            statusElement.textContent = "Đề không có nghiệm, vui lòng chọn mức khác.";
            return;
        }
        gameState.solutionBoard = res.solution;
        gameState.active = true;
        renderPuzzleForPlay();
        statusElement.textContent =
            `Đang chơi Sudoku (mức: ${level.toUpperCase()}). Bạn có 3 Hint và 3 lần sai.`;
    } else if (currentMode === "solve") {
        const board = choosePuzzle(level, null);
        if (!board) {
            statusElement.textContent = "Hiện không có đề cho mức độ này.";
            return;
        }
        renderPuzzleForSolve();
        statusElement.textContent =
            `Máy sẵn sàng giải Sudoku (mức: ${level.toUpperCase()}). Chọn "Giải toàn bộ" hoặc "Minh hoạ".`;
    }
}
function showScreen(name) {
    screenStart.classList.add("hidden");
    screenMode.classList.add("hidden");
    screenApp.classList.add("hidden");
    if (name === "start") screenStart.classList.remove("hidden");
    else if (name === "mode") screenMode.classList.remove("hidden");
    else if (name === "app") screenApp.classList.remove("hidden");
}
document.addEventListener("DOMContentLoaded", () => {
    createBoardUI();
    btnStart.addEventListener("click", () => {
        showScreen("mode");
    });
    btnModePlay.addEventListener("click", () => {
        currentMode = "play";
        resetPlayState();
        resetVisualState();
        clearAllCells();
        appTitle.textContent = "Chế độ TỰ CHƠI";
        boardDesc.textContent =
            "Chọn mức độ, sau đó tự điền số. Sai 3 lần sẽ GAME OVER. Có tối đa 3 Hint.";
        playControls.classList.remove("hidden");
        solveControls.classList.add("hidden");
        gameOverPanel.classList.add("hidden");
        showScreen("app");
    });
    btnModeSolve.addEventListener("click", () => {
        currentMode = "solve";
        resetPlayState();
        resetVisualState();
        clearAllCells();
        appTitle.textContent = "Chế độ MÁY GIẢI";
        boardDesc.textContent =
            "Chọn mức độ, sau đó dùng 'Giải toàn bộ' hoặc 'Minh hoạ (20 bước đầu)'.";
        playControls.classList.add("hidden");
        solveControls.classList.remove("hidden");
        gameOverPanel.classList.add("hidden");
        showScreen("app");
    });
    btnBackMode.addEventListener("click", () => {
        if (isAnimating) return;
        resetPlayState();
        clearAllCells();
        showScreen("mode");
        statusElement.textContent = "Hãy chọn mức độ đề";
    });
    document.querySelectorAll(".difficulty-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const level = btn.dataset.level;
            handleDifficultyClick(level);
        });
    });
    btnPlayHint.addEventListener("click", handlePlayHintClick);
    btnSolveAuto.addEventListener("click", handleSolveAuto);
    btnSolveVisual.addEventListener("click", handleSolveVisual);
    btnOverRetry.addEventListener("click", handleGameOverRetry);
    btnOverRandom.addEventListener("click", handleGameOverRandom);
    btnOverExit.addEventListener("click", handleGameOverExit);
    btnSolvePause.addEventListener("click", handleSolvePause);
    btnSolveResult.addEventListener("click", handleSolveShowResult);
    showScreen("start");
});

