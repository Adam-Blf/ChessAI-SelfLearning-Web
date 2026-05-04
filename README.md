# Chess AI Self-Learning Web

<!-- adam-badges:start -->
[![commits](https://img.shields.io/github/commit-activity/t/Adam-Blf/ChessAI-SelfLearning-Web?color=001329&label=commits&style=flat-square)](https://github.com/Adam-Blf/ChessAI-SelfLearning-Web/commits) [![visites](https://hits.sh/github.com/Adam-Blf/ChessAI-SelfLearning-Web.svg?style=flat-square&label=visites&color=001329)](https://hits.sh/github.com/Adam-Blf/ChessAI-SelfLearning-Web/) [![last commit](https://img.shields.io/github/last-commit/Adam-Blf/ChessAI-SelfLearning-Web?color=D4A437&style=flat-square&label=dernier%20push)](https://github.com/Adam-Blf/ChessAI-SelfLearning-Web/commits) [![top language](https://img.shields.io/github/languages/top/Adam-Blf/ChessAI-SelfLearning-Web?style=flat-square)](https://github.com/Adam-Blf/ChessAI-SelfLearning-Web) [![license](https://img.shields.io/github/license/Adam-Blf/ChessAI-SelfLearning-Web?style=flat-square&color=D4A437)](LICENSE)
<!-- adam-badges:end -->


![Status](https://img.shields.io/badge/status-active-brightgreen)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?logo=flask&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/frontend-Vercel-000?logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/backend-Render-46E3B7?logo=render&logoColor=white)

Jeu d'echecs avec IA auto-apprenante dans le navigateur, algorithmes minimax et deep learning cote Flask.

**Live** · https://chess-ai-self-learning-web.vercel.app

---

## Deployment Guide

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


---

<p align="center">
  <sub>Par <a href="https://adam.beloucif.com">Adam Beloucif</a> · Data Engineer & Fullstack Developer · <a href="https://github.com/Adam-Blf">GitHub</a> · <a href="https://www.linkedin.com/in/adambeloucif/">LinkedIn</a></sub>
</p>