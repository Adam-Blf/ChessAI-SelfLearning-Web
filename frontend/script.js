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
var autoTrainingMode = false;
var trainingStats = {
    gamesPlayed: 0,
    whiteWins: 0,
    blackWins: 0,
    draws: 0
};

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
        if (autoTrainingMode) {
            // Update stats
            if (moveColor === 'White') {
                trainingStats.blackWins++;
            } else {
                trainingStats.whiteWins++;
            }
            trainingStats.gamesPlayed++;
            updateTrainingStats();
            // Start new game after a short delay
            setTimeout(() => {
                game.reset();
                board.start();
                updateStatus();
                if (autoTrainingMode) {
                    makeAIMove(); // Start next game
                }
            }, 1000);
        }
    }
    // Draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position';
        if (autoTrainingMode) {
            trainingStats.draws++;
            trainingStats.gamesPlayed++;
            updateTrainingStats();
            // Start new game
            setTimeout(() => {
                game.reset();
                board.start();
                updateStatus();
                if (autoTrainingMode) {
                    makeAIMove();
                }
            }, 1000);
        }
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
            
            // If in auto-training mode, continue playing
            if (autoTrainingMode && !game.game_over()) {
                setTimeout(makeAIMove, 500);
            }
        } else {
            console.error("No move returned from AI");
            $status.html("AI failed to return a move.");
        }

    } catch (error) {
        console.error("Error fetching AI move:", error);
        $status.html("Error connecting to AI Server.");
    }
}

// --- Auto Training Functions ---
function startAutoTraining() {
    autoTrainingMode = true;
    $('#trainingBtn').text('⏸️ Stop Training').addClass('training-active');
    $('#resetBtn').prop('disabled', true);
    $eloRange.prop('disabled', true);
    board.draggable = false;
    
    // Reset stats
    trainingStats = {
        gamesPlayed: 0,
        whiteWins: 0,
        blackWins: 0,
        draws: 0
    };
    updateTrainingStats();
    
    // Start first game
    game.reset();
    board.start();
    updateStatus();
    makeAIMove();
}

function stopAutoTraining() {
    autoTrainingMode = false;
    $('#trainingBtn').text('🤖 Start Auto-Training').removeClass('training-active');
    $('#resetBtn').prop('disabled', false);
    $eloRange.prop('disabled', false);
    board.draggable = true;
}

function updateTrainingStats() {
    $('#gamesPlayed').text(trainingStats.gamesPlayed);
    $('#whiteWins').text(trainingStats.whiteWins);
    $('#blackWins').text(trainingStats.blackWins);
    $('#draws').text(trainingStats.draws);
    
    // Calculate win rates
    if (trainingStats.gamesPlayed > 0) {
        const whiteWinRate = ((trainingStats.whiteWins / trainingStats.gamesPlayed) * 100).toFixed(1);
        const blackWinRate = ((trainingStats.blackWins / trainingStats.gamesPlayed) * 100).toFixed(1);
        const drawRate = ((trainingStats.draws / trainingStats.gamesPlayed) * 100).toFixed(1);
        
        $('#whiteWinRate').text(whiteWinRate + '%');
        $('#blackWinRate').text(blackWinRate + '%');
        $('#drawRate').text(drawRate + '%');
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

// Training Button
$('#trainingBtn').on('click', function () {
    if (autoTrainingMode) {
        stopAutoTraining();
    } else {
        startAutoTraining();
    }
});
