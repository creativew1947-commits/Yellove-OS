# Yellove OS - Project Overview

## 🏟️ Mission Statement
Yellove OS is a high-performance, intelligent stadium orchestration platform designed for **Chennai Super Kings (CSK)** fans at the M. A. Chidambaram Stadium (Chepauk). It combines real-time telemetry, AI-driven strategic guidance, and precision navigation to transform the match-day experience.

---

## 🛠️ Core Technology Stack
- **Frontend**: React (Vite) with Tailwind CSS for high-speed tactical UI.
- **Intelligence**: Google Gemini (Direct Logic Vault) for real-time stadium reasoning.
- **Telemetry**: Firebase Realtime Database for crowd density and queue monitoring.
- **Navigation**: Google Maps Platform (Directions, Places, Geocoding, Distance Matrix).
- **Communication**: Centralized Services Layer (Clean Architecture).

---

## 🏗️ System Architecture
Yellove OS follows a **Service-Oriented Architecture (SOA)** with a strict "Clean Boundary" policy:

1.  **Orchestration Layer (`src/window-system/App.jsx`)**: Global state management and tactical decision triggers.
2.  **Intelligence Layer (`src/services/googleAI.js`)**: Self-healing Gemini integration with real-time model discovery.
3.  **Telemetry Layer (`src/services/firebase.js`)**: Real-time sync of stadium metrics (Crowd, Food, Transport).
4.  **Navigation Layer (`src/services/navigationService.js`)**: Precision routing with mode-specific tactical colors (Yellow/Emerald/Indigo).
5.  **Utilities (`src/core/utils/`)**: Shared logic for smart decisions and coordinate telemetry.

---

## 🚦 Key Features
- **Captain AI Assistant**: A persona-driven (Captain Yellove) strategic chat handler for fan queries.
- **Smart Return Hub**: Multi-modal extraction selector (Metro, Train, Bus, Cab) with live ETA.
- **Match Momentum**: Real-time crowd density visualization on the Chepauk matrix.
- **Squad Radar**: Proximity tracking for friends and family within the stadium concourse.
- **Auto-Healing Logic**: Redundant API strategies to ensure 100% service uptime for critical stadium functions.

---

## 📂 Project Structure
```text
/src
  ├── /app-system        # Strategic UI Components (Map, AI Hub, Panels)
  ├── /window-system     # Core Application Shell & Orchestration
  ├── /services          # EXPLICIT API logic (The "Direct Logic Vault")
  ├── /core              # Hooks, Utils, and Global Constants
  └── /assets            # Theming and graphical assets
```

---

## 💛 Design Philosophy
Everything in Yellove OS is built around the **"Whistle Podu"** spirit. The UI uses the iconic CSK Gold (#F9CD05) as a primary tactical highlight, combined with deep stadium-night blues and high-visibility status indicators.

---

*Engineered for the ultimate Yellove experience at Chepauk.*
