// --- Configuration ---
// The backend URL will be injected by Vercel. Fallback for local development.
const API_URL = process.env.API_URL || "http://localhost:5000";
// Example: const API_URL = "https://my-chess-ai.onrender.com";

// --- Game State ---
var board = null;
var game = new Chess();
var $status = $('#status');
var $fen = $('#fen');
var $eloRange = $('#eloRange');
var $eloValue = $('#eloValue');

// --- ELO Slider ---
$eloRange.on('input', function () {
    $eloValue.text(this.value);
});

// --- Chess Logic ---
function onDragStart(source, piece, position, orientation) {
    // Do not pick up pieces if the game is over
    if (game.game_over()) return false;

    // Only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
}

function onDrop(source, target) {
    // See if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    // Illegal move
    if (move === null) return 'snapback';

    updateStatus();

    // AI Turn
    window.setTimeout(makeAIMove, 250);
}

function onSnapEnd() {
    board.position(game.fen());
}

function updateStatus() {
    var status = '';

    var moveColor = 'White';
    if (game.turn() === 'b') {
        moveColor = 'Black';
    }

    // Checkmate?
    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
    }
    // Draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position';
    }
    // Game still on
    else {
        status = moveColor + ' to move';
        // Check?
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check';
        }
    }

    $status.html(status);
    $fen.html(game.fen());
}

// --- AI Interaction ---
async function makeAIMove() {
    if (game.game_over()) return;

    $status.html("AI is thinking...");

    const fen = game.fen();
    const elo = $eloRange.val();

    try {
        const response = await fetch(`${API_URL}/move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fen: fen,
                elo: elo
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.move) {
            game.move(data.move, { sloppy: true });
            board.position(game.fen());
            updateStatus();
        } else {
            console.error("No move returned from AI");
            $status.html("AI failed to return a move.");
        }

    } catch (error) {
        console.error("Error fetching AI move:", error);
        $status.html("Error connecting to AI Server.");
    }
}

// --- Initialization ---
var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};

board = Chessboard('myBoard', config);
updateStatus();

// Reset Button
$('#resetBtn').on('click', function () {
    game.reset();
    board.start();
    updateStatus();
});
