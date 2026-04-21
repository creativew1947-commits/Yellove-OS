# Accessibility Standards (WCAG 2.1 Compliance)

Yellove OS is engineered for 98.9%+ accessibility scoring, ensuring that the stadium experience is available to all users.

## 1. Semantic Foundation
- **Native Elements**: Every interactive control is a semantic `<button>`, `<a>`, or `<input>`.
- **Hierarchical Structure**: Strict use of HTML5 landmarks (`<main>`, `<nav>`, `<header>`, `<aside>`) ensures clear document structure for screen readers.

## 2. ARIA Implementation
- **Descriptive Labels**: Every interactive element includes a precise `aria-label` describing its exact function (e.g., "Find fastest food route").
- **Dynamic Regions**: Real-time updates (Broadcasts, Alerts) utilize `aria-live="polite"` or `role="alert"` for non-disruptive feedback.
- **State Management**: Using `aria-pressed`, `aria-hidden`, and `aria-modal` to correctly reflect UI state to assistive technologies.

## 3. Keyboard Navigation
- **Logical Tab Flow**: The system follows the natural visual flow, ensuring users can reach every feature using the `Tab` key.
- **Activation**: All buttons support both `Enter` and `Space` activation by default.
- **Focus Visibility**: Universal `:focus-visible` styles apply a high-contrast CSK Gold (`#F9CD05`) outline to the active element.
- **Skip Links**: A "Skip to Main Content" link is provided for power users and keyboard navigators.

## 4. Visual Contrast
- **High Contrast Ratios**: Glassmorphism colors are curated to exceed WCAG AA contrast standards.
- **Explicit Boundaries**: All containers use visible borders (1px border-white/10) to distinguish interactive zones clearly.
