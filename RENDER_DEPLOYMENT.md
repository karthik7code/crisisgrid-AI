# Deploying CrisisGrid AI to Render

This repository is pre-configured for deployment on **Render** (as a native Node.js Web Service or Docker container).

---

## Architecture Overview

- **Frontend:** React 19 + Vite (built to `/dist`)
- **Backend:** Express + TypeScript (`server.ts` executed via `tsx`)
- **Single Service:** The Express server serves both the backend API endpoints (`/simulate`, `/emergency`, `/compare-strategies`, `/health`) and the production SPA frontend from `/dist`.

---

## Method 1: Automatic Blueprint Deployment (Recommended)

Render provides automatic infrastructure-as-code deployment using the `render.yaml` file in this repository.

1. **Push your code to GitHub:**
   Ensure this repository is pushed to your GitHub account (`https://github.com/karthik7code/crisisgrid-AI`).

2. **Log in to Render:**
   Go to [dashboard.render.com](https://dashboard.render.com).

3. **Deploy with Blueprint:**
   - Click **New +** in the top navigation bar.
   - Select **Blueprint**.
   - Connect your GitHub repository (`karthik7code/crisisgrid-AI`).
   - Render will detect `render.yaml` and configure:
     - **Service Name:** `crisisgrid-ai`
     - **Environment:** `Node`
     - **Plan:** `Free`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
     - **Health Check Path:** `/health`
   - Click **Apply**.

---

## Method 2: Manual Web Service Deployment

If you prefer to configure the Web Service manually via Render's dashboard:

1. In the Render Dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub repository (`karthik7code/crisisgrid-AI`).
3. Set the following settings:
   - **Name:** `crisisgrid-ai`
   - **Language / Runtime:** `Node`
   - **Branch:** `main`
   - **Region:** Any (e.g. `Oregon (US West)` or `Frankfurt (EU Central)`)
   - **Build Command:**
     ```bash
     npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** `Free`
4. Expand **Advanced** and set:
   - **Health Check Path:** `/health`
   - **Environment Variables:**
     | Key | Value | Notes |
     |---|---|---|
     | `NODE_ENV` | `production` | Enables production static file serving |
     | `PORT` | `10000` | (Render assigns this automatically) |
     | `GEMINI_API_KEY` | *(your Gemini key)* | Optional, if using Gemini features |
5. Click **Create Web Service**.

---

## Method 3: Docker Deployment (Alternative)

A multi-stage `Dockerfile` is included in this repository.

1. In Render, select **New +** > **Web Service**.
2. Choose **Docker** as the runtime.
3. Render will build using the `Dockerfile`, expose port `10000`, and launch the app.

---

## Verifying the Deployment

Once Render finishes the build (usually ~2 minutes):
1. **Health Check:**
   Visit `https://<your-render-subdomain>.onrender.com/health`
   Expected response:
   ```json
   {
     "status": "healthy",
     "engine": "CrisisGrid Multi-Agent Negotiation Engine v1.0",
     "active_scenario": "Flood"
   }
   ```
2. **Web UI:**
   Visit `https://<your-render-subdomain>.onrender.com` to interact with the full CrisisGrid AI platform.
