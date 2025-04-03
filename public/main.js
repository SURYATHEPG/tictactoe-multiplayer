document.addEventListener("DOMContentLoaded", () => {
    fetch("/get-ip")
        .then(res => res.json())
        .then(data => {
            const socket = io(`http://${data.ip}:3000`);
            setupGame(socket);
        });

    function setupGame(socket) {
        const cells = document.querySelectorAll(".cell");
        const statusText = document.getElementById("status");
        const resetButton = document.getElementById("reset");
        const playOnlineButton = document.getElementById("playOnline");
        const playOfflineButton = document.getElementById("playOffline");
        const modeStatus = document.getElementById("modeStatus");

        let board = ["", "", "", "", "", "", "", "", ""];
        let currentPlayer = "X";
        let mySymbol = null;
        let gameActive = false;
        let onlineMode = false;

        playOnlineButton.addEventListener("click", () => {
            onlineMode = true;
            modeStatus.textContent = "Playing Online - Waiting for opponent...";
            socket.emit("joinGame");
        });

        playOfflineButton.addEventListener("click", () => {
            onlineMode = false;
            modeStatus.textContent = "Playing Offline - Two players on the same device";
            gameActive = true;
        });

        socket.on("playerRole", (symbol) => {
            mySymbol = symbol;
            statusText.textContent = `You are Player ${symbol}. Waiting for opponent...`;
        });

        socket.on("playerCount", (count) => {
            if (count === 2) {
                statusText.textContent = "Game started! Your turn.";
                gameActive = true;
            } else {
                statusText.textContent = "Waiting for another player...";
                gameActive = false;
            }
        });

        socket.on("roomFull", () => {
            alert("Room is full! Try again later.");
        });

        cells.forEach(cell => {
            cell.addEventListener("click", () => {
                const index = cell.getAttribute("data-index");

                if (onlineMode) {
                    if (!gameActive || cell.textContent !== "" || mySymbol !== currentPlayer) return;
                    socket.emit("playerMove", { index, symbol: mySymbol });
                } else {
                    if (!gameActive || cell.textContent !== "") return;
                    board[index] = currentPlayer;
                    cell.textContent = currentPlayer;
                    checkWinner();
                    currentPlayer = currentPlayer === "X" ? "O" : "X";
                }
            });
        });

        socket.on("updateBoard", ({ index, symbol }) => {
            board[index] = symbol;
            cells[index].textContent = symbol;
            checkWinner();
            currentPlayer = currentPlayer === "X" ? "O" : "X";
        });

        function checkWinner() {
            const winConditions = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];

            for (const condition of winConditions) {
                let [a, b, c] = condition;
                if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                    statusText.textContent = `${board[a]} wins! 🎉`;
                    gameActive = false;
                    return;
                }
            }

            if (!board.includes("")) {
                statusText.textContent = "It's a Draw! 🤝";
                gameActive = false;
            }
        }
    }
});
