<div align="center">
  <img src="https://img.icons8.com/color/150/000000/bot.png" alt="WorkTwin Logo" />
  <h1>🤖 WorkTwin</h1>
  <p><b>Your AI Work Partner</b></p>
  <p>An intelligent, autonomous workspace assistant that watches how you work, finds automation opportunities, and executes them for you.</p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=Playwright&logoColor=white" alt="Playwright" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
    <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  </p>
</div>

---

## 🌟 Overview

**WorkTwin** is a comprehensive AI automation system designed to bridge the gap between manual repetitive tasks and full automation. It consists of three main pillars:
1. **Desktop Observer:** A local python agent that silently maps your user journey, recognizing interactive elements, key presses, and window context.
2. **Intelligence Engine:** Powered by Google Gemini, the engine identifies workflow inefficiencies (repetitive sequences, high friction, context switching) and suggests an *Automation Plan*.
3. **Execution Engine:** A Playwright-powered runner that can automatically replay the optimized AI-generated workflows on your browser.

## 🚀 Key Features
- 👁️ **Real-time Semantic Observation:** Tracks what you do, not just where you click.
- 🧠 **AI Analytics:** Automatically detects repetitive patterns and calculates Friction/ROI metrics.
- ⚡ **Auto-Execution:** Re-runs your recorded workflows deterministically using an integrated browser engine.
- 📊 **Beautiful Dashboard:** Monitor your activity, visualize bottlenecks, and trigger automations with a single click.

---

## 🏗️ Architecture

```mermaid
graph TD;
    subgraph Local Environment
        O[Python Observer<br>pynput, pywin32] -->|Socket.IO| B[Node.js Backend]
        F[React Frontend<br>Vite, Tailwind] -->|REST / WS| B
        B -->|Playwright| E[Browser Automation]
    end
    
    subgraph Cloud Intelligence
        B <-->|Metrics & Analysis| G[Google Gemini AI]
        B <-->|Persistent Storage| DB[Firebase Firestore]
    end
    
    style O fill:#3776AB,stroke:#fff,stroke-width:2px,color:#fff
    style B fill:#339933,stroke:#fff,stroke-width:2px,color:#fff
    style F fill:#20232A,stroke:#61DAFB,stroke-width:2px,color:#fff
    style G fill:#4285F4,stroke:#fff,stroke-width:2px,color:#fff
    style DB fill:#FFCA28,stroke:#fff,stroke-width:2px,color:#000
    style E fill:#45ba4b,stroke:#fff,stroke-width:2px,color:#fff
```

---

## 📊 Analytics & Flow Detection

WorkTwin evaluates workflows using a multi-dimensional metric system. The engine calculates the **Friction Score** and **Automation Potential** based on:
- Total Duration & Idle Time
- Application Context Switches
- Copy/Paste Rework Events
- Semantic Element Targets

```mermaid
sequenceDiagram
    participant User
    participant Observer
    participant Backend
    participant Gemini
    participant Playwright
    
    User->>Observer: Clicks, Types, Navigates
    Observer->>Backend: Streams Semantic Events
    Backend->>Backend: Detects Workflow Pattern
    Backend->>Gemini: Sends Workflow Metrics
    Gemini-->>Backend: Returns Automation Plan & Insights
    Backend->>User: Displays "Top Opportunity"
    User->>Backend: Clicks "Run Automation"
    Backend->>Playwright: Injects Steps
    Playwright-->>User: Executes Workflow Visually
```

---

## ⚙️ Setup & Installation

This project requires three concurrent processes to be running:

### 1. Database & AI Credentials
Ensure you have your `.env` configured in the backend with:
```env
GEMINI_API_KEY=your_google_gemini_key
```

### 2. Start the Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```

### 3. Start the Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

### 4. Start the Desktop Observer (Python)
*Must be run on a Windows machine for active window tracking.*
```bash
cd observer
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

---

## 🛠️ Built With Love
Developed with modern web technologies and the latest in Generative AI, WorkTwin transforms how we think about personal robotic process automation.
