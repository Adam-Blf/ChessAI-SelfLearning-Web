import chess
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import random
import threading
import time
import os

# --- Neural Network ---
class ChessNet(nn.Module):
    def __init__(self):
        super(ChessNet, self).__init__()
        # Input: 64 squares * 12 piece types = 768 inputs (simplified representation)
        self.fc1 = nn.Linear(768, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, 1) # Output: Board evaluation (-1 to 1)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = torch.tanh(self.fc3(x))
        return x

# --- Engine ---
class ChessEngine:
    def __init__(self, model_path="model.pth"):
        self.model = ChessNet()
        self.model_path = model_path
        self.load_model()
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.001)
        self.criterion = nn.MSELoss()

    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.model.load_state_dict(torch.load(self.model_path))
                print(f"Model loaded from {self.model_path}")
            except Exception as e:
                print(f"Error loading model: {e}")
        else:
            print("No existing model found, starting fresh.")

    def save_model(self):
        torch.save(self.model.state_dict(), self.model_path)
        print(f"Model saved to {self.model_path}")

    def board_to_tensor(self, board):
        # Simple representation: 64 squares, 12 piece types
        # This is a very basic encoding.
        pieces = [
            chess.PAWN, chess.KNIGHT, chess.BISHOP, chess.ROOK, chess.QUEEN, chess.KING
        ]
        x = np.zeros(768, dtype=np.float32)
        
        for square in chess.SQUARES:
            piece = board.piece_at(square)
            if piece:
                # Calculate index: (Square * 12) + (PieceType_Index + Color_Offset)
                # Color_Offset: 0 for White, 6 for Black
                offset = 0 if piece.color == chess.WHITE else 6
                piece_idx = pieces.index(piece.piece_type)
                idx = (square * 12) + (piece_idx + offset)
                x[idx] = 1.0
        
        return torch.from_numpy(x).unsqueeze(0) # Add batch dimension

    def evaluate(self, board):
        with torch.no_grad():
            tensor = self.board_to_tensor(board)
            return self.model(tensor).item()

    def get_move(self, fen, target_elo):
        board = chess.Board(fen)
        legal_moves = list(board.legal_moves)
        
        if not legal_moves:
            return None

        # ELO Logic
        if target_elo < 1000:
            # Low ELO: High randomness, depth 1
            if random.random() < 0.5:
                return str(random.choice(legal_moves))
            depth = 1
        elif target_elo < 1800:
            # Mid ELO: Some randomness, depth 2
            if random.random() < 0.2:
                return str(random.choice(legal_moves))
            depth = 2
        else:
            # High ELO: Best move, depth 3 (limited for performance)
            depth = 3

        best_move = None
        best_val = -float('inf') if board.turn == chess.WHITE else float('inf')

        # Simple Minimax (No Alpha-Beta for brevity, but recommended)
        for move in legal_moves:
            board.push(move)
            val = self.minimax(board, depth - 1, -float('inf'), float('inf'), not board.turn)
            board.pop()

            if board.turn == chess.WHITE:
                if val > best_val:
                    best_val = val
                    best_move = move
            else:
                if val < best_val:
                    best_val = val
                    best_move = move
        
        return str(best_move) if best_move else str(random.choice(legal_moves))

    def minimax(self, board, depth, alpha, beta, maximizing_player):
        if depth == 0 or board.is_game_over():
            return self.evaluate(board)

        if maximizing_player:
            max_eval = -float('inf')
            for move in board.legal_moves:
                board.push(move)
                eval = self.minimax(board, depth - 1, alpha, beta, False)
                board.pop()
                max_eval = max(max_eval, eval)
                alpha = max(alpha, eval)
                if beta <= alpha:
                    break
            return max_eval
        else:
            min_eval = float('inf')
            for move in board.legal_moves:
                board.push(move)
                eval = self.minimax(board, depth - 1, alpha, beta, True)
                board.pop()
                min_eval = min(min_eval, eval)
                beta = min(beta, eval)
                if beta <= alpha:
                    break
            return min_eval

    def train_step(self, board_tensor, target_val):
        self.optimizer.zero_grad()
        output = self.model(board_tensor)
        loss = self.criterion(output, torch.tensor([[target_val]], dtype=torch.float32))
        loss.backward()
        self.optimizer.step()
        return loss.item()

# --- Self Training ---
class SelfTrainer:
    def __init__(self, engine):
        self.engine = engine
        self.running = True
        self.thread = threading.Thread(target=self.loop, daemon=True)

    def start(self):
        self.thread.start()

    def loop(self):
        print("Self-training started...")
        while self.running:
            try:
                self.play_game()
                # Sleep a bit to not hog CPU
                time.sleep(1) 
            except Exception as e:
                print(f"Error in self-training: {e}")

    def play_game(self):
        board = chess.Board()
        game_history = []
        
        while not board.is_game_over():
            # Self-play uses some randomness to explore
            if random.random() < 0.1:
                move = random.choice(list(board.legal_moves))
            else:
                # Use engine with low depth for speed
                move_str = self.engine.get_move(board.fen(), 2000) 
                move = chess.Move.from_uci(move_str)
            
            # Store state for training
            game_history.append((self.engine.board_to_tensor(board), board.turn))
            board.push(move)
        
        # Game over, determine reward
        result = board.result()
        if result == "1-0":
            reward = 1.0
        elif result == "0-1":
            reward = -1.0
        else:
            reward = 0.0

        # Backpropagate
        # Simple reinforcement: White moves get reward, Black moves get -reward (if White won)
        # Actually, if White won (1.0), White positions should evaluate to 1.0, Black to -1.0?
        # Let's simplify: Winner's positions -> 1.0, Loser's -> -1.0
        
        for tensor, turn in game_history:
            target = reward
            # If it was Black's turn and White won (reward=1), this position was bad for Black?
            # Or rather, the evaluation is always from White's perspective.
            # So if White won, all positions should ideally eval to 1.0.
            
            self.engine.train_step(tensor, target)
        
        self.engine.save_model()
        print(f"Self-play game finished. Result: {result}")

