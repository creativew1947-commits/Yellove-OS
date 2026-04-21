# Yellove OS - System Overview

Yellove OS is a futuristic stadium orchestration platform designed for high-performance telemetry and real-time strategic routing. It implements a multi-layered architecture to ensure separation of concerns and production stability.

## Architectural Layers

### 1. Core Layer (`/core`)
The logical backbone of the system.
- **Hooks**: Reactive logic for lifecycle and shared state management.
- **Utils**: Pure functional units for deterministic calculations (Decision Engine, Distance Matrix).
- **Config**: Static system parameters and stadium matrix definitions.

### 2. Window System (`/window-system`)
The OS-level orchestration layer that manages the environment and global UI state.
- **Main Shell (`App.jsx`)**: The central hub coordinator.
- **System Panels**: Authentication, global navigation, and time-sync services.
- **Environment States**: Handling online/offline connectivity transitions.

### 3. Application System (`/app-system`)
Functional modules that provide the end-user stadium experience.
- **Stadium Matrix**: Interactive topography and crowd density mapping.
- **Captain AI**: Strategic assistant utilizing Google Gemini for real-time guidance.
- **Smart Return Hub**: Multi-modal transit optimization.

### 4. Services Layer (`/services`)
High-level integrations with external cloud platforms.
- **Google AI**: Direct integration with Gemini 1.5 Pro.
- **Firebase**: Real-time telemetry and secure identity management.
- **Google Maps**: Suite of geospatial services (Routes, Places, Geocoding).

## Performance & Efficiency
The system utilizes React lazy loading and memoization to maintain a lightweight footprint. All UI components are built using CSS-first glassmorphism to reduce Javascript animation overhead, ensuring fluid 60FPS performance on mobile devices.
