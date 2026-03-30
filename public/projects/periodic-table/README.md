# Interactive Periodic Table

A visually stunning, interactive periodic table web application featuring an animated background and element information display.

## Features

### 🎨 Visual Design
- **Modern Grid Layout**: Elements arranged in the standard periodic table layout using CSS Grid
- **Animated Background**: Dynamic P5.js animation with moving circles and connecting lines
- **Color-Coded Elements**: Elements are color-coded by category with distinct border colors:
  - 🔴 Alkali Metals (red)
  - 🟠 Alkali Earth Metals (orange)
  - 🟡 Transition Metals (yellow)
  - 🟢 Basic Metals (green)
  - 🔵 Semimetals (cyan)
  - 🔵 Nonmetals (blue)
  - 🟣 Halogens (light purple)
  - 🟣 Noble Gases (magenta)
  - 🟢 Lanthanides (bright green)
  - 🟣 Actinides (pink)

### ⚡ Interactive Features
- **Hover Effects**: Elements change appearance when hovered over
- **Click to Explore**: Click any element to open a detailed information modal
- **Wikipedia Integration**: Each element modal displays its Wikipedia page in an embedded iframe
- **Responsive Design**: Adapts to different screen sizes with viewport-based font scaling

### 🔬 Element Information
Each element displays:
- Chemical symbol (large, prominent)
- Atomic number (top-left corner)
- Element name (bottom of element)
- Category classification (via color coding)

## Technical Implementation

### Architecture
The application follows a clean separation of concerns:

```
📁 PeriodicTable/
├── 📄 index.html       # HTML structure and layout
├── 🎨 styles.css       # All styling and visual presentation
└── ⚡ script.js        # Interactive functionality and animations
```

### Technologies Used
- **HTML5**: Semantic markup and structure
- **CSS3**: Grid layout, animations, and responsive design
- **JavaScript (ES6+)**: Interactive functionality
- **jQuery**: DOM manipulation and event handling
- **P5.js**: Canvas-based background animation
- **Bootstrap 4**: Modal components and responsive utilities

### Key Components

#### 1. Grid Layout System
- 18-column CSS Grid representing the periodic table structure
- Precise element positioning using `grid-column` and `grid-row` properties
- Responsive spacing and sizing

#### 2. Background Animation
- 50 animated circles moving across the canvas
- Dynamic line connections between nearby circles
- Smooth animations that respond to window resizing

#### 3. Interactive Modal System
- Overlay system for element details
- Wikipedia iframe integration
- Smooth show/hide animations

## File Structure

### `index.html`
Contains the complete periodic table structure with all 118 elements, including:
- Main periodic table grid
- Lanthanides and Actinides series
- Modal overlay system
- External library imports

### `styles.css`
Comprehensive styling including:
- Element grid positioning for all 118 elements
- Color schemes for element categories
- Responsive typography with viewport units
- Modal and overlay styling
- Hover and interaction effects

### `script.js`
JavaScript functionality including:
- P5.js animation system with Circle class
- Event handlers for element interactions
- jQuery-based hover effects
- Modal management system

## Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Internet connection (for external libraries and Wikipedia content)

### Installation
1. Clone or download the project files
2. Ensure all three files are in the same directory:
   - `index.html`
   - `styles.css`
   - `script.js`
3. Open `index.html` in a web browser

### Usage
1. **Browse Elements**: Hover over elements to see hover effects
2. **View Details**: Click any element to open its information modal
3. **Explore**: Use the Wikipedia integration to learn more about each element
4. **Close Modal**: Click the × button or outside the modal to close

## Browser Compatibility
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Responsive Design
The application adapts to various screen sizes:
- **Desktop**: Full periodic table layout with optimal spacing
- **Tablet**: Adjusted font sizes and spacing
- **Mobile**: Compact layout with touch-friendly interactions

## Educational Value
Perfect for:
- 🎓 Chemistry students learning element properties
- 👨‍🏫 Educators teaching periodic trends
- 🔬 Anyone interested in exploring chemical elements
- 💻 Developers learning CSS Grid and animation techniques

## Future Enhancements
Potential improvements could include:
- Element property data display (atomic mass, electron configuration, etc.)
- Search and filter functionality
- Element comparison features
- Offline Wikipedia content caching
- Additional animation themes

## License
This project is open source and available for educational and personal use.

---

*Built with modern web technologies for an engaging chemistry learning experience.*
