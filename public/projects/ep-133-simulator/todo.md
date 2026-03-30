# EP-133 Simulator – Todo List

## Status Icon Enhancements
- [ ] Allow `setStatusIcon` to enable/disable multiple icons at once (accept array or range).
- [ ] Add support for more complex status icon patterns (e.g., diagonal, alternating, etc.).
- [ ] Animate status icons in custom patterns (not just sequential).
- [x] Ensure status icons that need to be handled at the same time are.

## Sequencer & Playback
- [ ] Implement actual step sequencing logic (sound playback per step, not just icon animation).
- [ ] Add support for recording and editing sequences.
- [ ] Visual feedback for current step in the sequencer grid.

## Pad Functionality
- [ ] Implement full functionality for all special pads (mute, trig, lift, punch, chop, accent).
- [ ] Add visual and audio feedback for each pad type.
- [ ] Support for pad velocity or pressure (if applicable).

## Audio Engine
- [ ] Replace simple oscillator demo with actual sample playback.
- [ ] Add support for loading and managing user samples.
- [ ] Implement effects (FX) and crossfader logic.

## UI/UX Improvements
- [ ] Add an orange slider above the 'Power' label at the top to power up/down the device.
      When powered off, all display icons will be dimmed out and all controls in the main area disabled.
- [ ] Add tooltips and help overlays for controls.
- [ ] Improve mobile/touch support (gestures, drag, etc.).
- [ ] Add accessibility features (keyboard navigation, ARIA labels).

## Settings & Persistence
- [ ] Allow saving/loading of user patterns and settings.
- [ ] Add import/export for patterns and samples.
- [ ] Implement undo/redo for user actions.

## Debug & Developer Tools
- [ ] Expand `EP133Debug` with more test patterns and diagnostics.
- [ ] Add a visual debug overlay for step and pad states.

## General Code Improvements
- [ ] Refactor large methods for readability and maintainability.
- [ ] Add comments and documentation for public methods.
- [ ] Write unit tests for core logic (if test framework is present).
- [x] Move constants and status ids into their own files.
