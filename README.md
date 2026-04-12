# Intent-Based Predictive Crowd Assistant

## Problem Statement
Large stadiums and sports venues suffer from intense congestion, especially during peak moments like halftime rushes or match exits. Traditional static maps cannot dynamically route people away from these choke points, leading to poor user experience and safety hazards.

## Solution Overview
A Full-Stack web application that acts as an **Intent-Based Predictive Crowd Assistant**. It dynamically reroutes fans based on their location, intent (e.g., getting food, leaving early), and time phase (e.g., halftime) by predicting and analyzing real-time crowd densities.

## Features
- **Dynamic AI Decision Engine:** Harnesses AI to output rule-based, context-aware navigational data.
- **Predictive Analytics:** Identifies potential future bottlenecks and suggests early movement.
- **Real-time Simulation:** A modular backend that continuously updates fake crowd sensors.
- **Vite React Frontend:** Clean, beautiful UI to visualize the intelligent routing.

## Architecture
REACT FRONTEND  ➔  CLOUD RUN (Node.js API)  ➔  CLOUD SQL (MySQL)  ➔  AI DECISION LOGIC (Prompt Engineering)

## Tech Stack
- Frontend: React + Vite + CSS
- Backend: Node.js + Express
- Database: MySQL
- AI: Google Antigravity & Gemini Prompts
- Deployment: Docker & Google Cloud Run

## How to Run Locally

### 1. Database Setup
Create the MySQL database:
\`\`\`bash
mysql -u root -p < schema.sql
\`\`\`

### 2. Backend & Frontend Installation
Install the project dependencies for both sides.
\`\`\`bash
npm install
cd frontend && npm install
\`\`\`

### 3. Run the App
To start the React frontend and Node backend simultaneously, use two terminals:
**Terminal 1 (Backend & Simulation):**
\`\`\`bash
npm start
\`\`\`
**Terminal 2 (Frontend):**
\`\`\`bash
cd frontend && npm run dev
\`\`\`

---

## Cloud Run & Cloud SQL Deployment Guide

### 1. Setup Google Cloud SQL (MySQL)
1. In GCP Console, create a new Cloud SQL MySQL instance.
2. Under Connections, enable **Public IP**.
3. Add `0.0.0.0/0` (or specifically your IP/Cloud Run IPs) to Authorized Networks for hackathon simplicity.
4. Create database `stadium_db` and a database user.

### 2. Deploy to Cloud Run
Using Google Cloud CLI, deploy this backend container:

```bash
gcloud run deploy crowd-assistant-backend \
  --source . \
  --port 8080 \
  --set-env-vars DB_HOST="YOUR_CLOUD_SQL_PUBLIC_IP",DB_USER="root",DB_PASSWORD="yourpassword",DB_NAME="stadium_db",PORT="8080" \
  --allow-unauthenticated
```

### 3. Alternative: Secure Connection (Cloud SQL Auth Proxy) - Optional
For a more secure production setup without whitelisting IPs:
- Use Cloud SQL Admin API.
- Connect Cloud Run securely using Cloud SQL Auth Proxy by adding `--add-cloudsql-instances="YOUR_CONNECTION_NAME"` during deployment and updating `DB_HOST=/cloudsql/YOUR_CONNECTION_NAME`.

---
*Built for Prompt Wars. 🏆*