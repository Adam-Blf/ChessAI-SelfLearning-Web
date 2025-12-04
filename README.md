# Deployment Guide: Chess AI Self-Learning Web

This project is split into two parts for deployment:
1.  **Backend (`/backend`)**: Python Flask app -> Deploy to **Render**.
2.  **Frontend (`/frontend`)**: Static HTML/JS -> Deploy to **Vercel**.

## 1. Deploy Backend to Render

1.  Create a new **Web Service** on [Render](https://render.com/).
2.  Connect your GitHub repository.
3.  **Root Directory**: Set this to `backend`.
4.  **Build Command**: `pip install -r requirements.txt`
5.  **Start Command**: `gunicorn app:app`
6.  Click **Create Web Service**.
7.  **Copy the URL** provided by Render (e.g., `https://chess-ai-backend.onrender.com`).

## 2. Configure Frontend

1.  Open `frontend/script.js`.
2.  Find the line:
    ```javascript
    const API_URL = "http://localhost:5000";
    ```
3.  Replace it with your **Render URL**:
    ```javascript
    const API_URL = "https://chess-ai-backend.onrender.com";
    ```
    *(Make sure to remove any trailing slash)*

## 3. Deploy Frontend to Vercel

1.  Go to [Vercel](https://vercel.com/) and add a **New Project**.
2.  Import the same GitHub repository.
3.  **Root Directory**: Edit this and select `frontend`.
4.  Click **Deploy**.

## Local Development

1.  **Backend**:
    ```bash
    cd backend
    pip install -r requirements.txt
    python app.py
    ```
2.  **Frontend**:
    Open `frontend/index.html` in your browser.
