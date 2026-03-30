(function () {
  const dashboard = document.getElementById("dashboard");
  const verticalSplitter = document.getElementById("verticalSplitter");
  const horizontalSplitter = document.getElementById("horizontalSplitter");
  const crossSplitter = document.getElementById("crossSplitter");
  const configTab = document.getElementById("configTab");
  const configDrawer = document.getElementById("configDrawer");
  const configClose = document.getElementById("configClose");
  const configBackdrop = document.getElementById("configBackdrop");
  const themeColorPicker = document.getElementById("themeColorPicker");
  const addFunctionPanelButton = document.getElementById("addFunctionPanel");
  const addAsteroidsPanelButton = document.getElementById("addAsteroidsPanel");
  const addPacmanPanelButton = document.getElementById("addPacmanPanel");

  const state = {
    splitX: 0.5,
    splitY: 0.5,
    minPanelSize: 160
  };
  const theme = {};
  const floatingPanels = new Map();
  const panelElements = [];
  const animatedPanels = [];
  let floatingZIndex = 20;
  let functionPanelCount = 0;
  let asteroidsPanelCount = 0;
  let pacmanPanelCount = 0;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    const value = Number.parseInt(normalized, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }

  function lighten(color, amount) {
    return {
      r: Math.round(color.r + (255 - color.r) * amount),
      g: Math.round(color.g + (255 - color.g) * amount),
      b: Math.round(color.b + (255 - color.b) * amount)
    };
  }

  function rgba(color, alpha) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  }

  function rgb(color) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  function applyThemeColor(hex) {
    const root = document.documentElement;
    const base = hexToRgb(hex);
    const bright = lighten(base, 0.78);
    const text = lighten(base, 0.9);
    const dim = lighten(base, 0.68);
    const glow = lighten(base, 0.2);
    const softGlow = lighten(base, 0.35);
    const pale = lighten(base, 0.82);

    theme.base = base;
    theme.bright = bright;
    theme.text = text;
    theme.dim = dim;
    theme.glow = glow;
    theme.softGlow = softGlow;
    theme.pale = pale;

    root.style.setProperty("--accent", hex);
    root.style.setProperty("--accent-soft", rgba(base, 0.35));
    root.style.setProperty("--accent-bright", rgb(bright));
    root.style.setProperty("--text-primary", rgb(text));
    root.style.setProperty("--text-dim", rgba(dim, 0.68));
    root.style.setProperty("--shadow-glow", `0 0 28px ${rgba(base, 0.16)}`);
    root.style.setProperty("--accent-ghost", rgba(base, 0.06));
    root.style.setProperty("--accent-faint", rgba(base, 0.08));
    root.style.setProperty("--accent-mid", rgba(base, 0.12));
    root.style.setProperty("--accent-grid", rgba(base, 0.14));
    root.style.setProperty("--accent-strong", rgba(base, 0.2));
    root.style.setProperty("--accent-intense", rgba(base, 0.28));
    root.style.setProperty("--accent-hot", rgba(base, 0.4));
    root.style.setProperty("--accent-core", rgba(base, 0.9));
    root.style.setProperty("--accent-top-glow", rgba(base, 0.09));
    root.style.setProperty("--panel-line", rgba(base, 0.22));
    root.style.setProperty("--cross-ring", rgba(base, 0.18));
  }

  function setDrawerOpen(isOpen) {
    document.body.classList.toggle("drawer-open", isOpen);
    configTab.setAttribute("aria-expanded", String(isOpen));
    configDrawer.setAttribute("aria-hidden", String(!isOpen));
    configBackdrop.hidden = !isOpen;
  }

  function bringPanelToFront(panel) {
    floatingZIndex += 1;
    panel.style.zIndex = String(floatingZIndex);
  }

  function clearDockTargets() {
    panelElements.forEach((panel) => {
      panel.classList.remove("is-dock-target");
    });
    floatingPanels.forEach((placeholder) => {
      placeholder.classList.remove("is-dock-target");
    });
  }

  function clampDetachedPanel(panel) {
    const margin = 12;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    const left = clamp(Number.parseFloat(panel.style.left || "0"), margin, maxLeft);
    const top = clamp(Number.parseFloat(panel.style.top || "0"), margin, maxTop);
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function undockPanel(panel) {
    if (floatingPanels.has(panel.dataset.panel)) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const placeholder = document.createElement("div");
    placeholder.className = `panel-placeholder ${Array.from(panel.classList)
      .filter((className) => className.startsWith("panel-") && className !== "panel-detached")
      .join(" ")}`;
    placeholder.dataset.panel = panel.dataset.panel;

    dashboard.insertBefore(placeholder, panel);
    document.body.appendChild(panel);

    panel.classList.add("panel-detached");
    panel.style.width = `${rect.width}px`;
    panel.style.height = `${rect.height}px`;
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    bringPanelToFront(panel);
    clampDetachedPanel(panel);
    floatingPanels.set(panel.dataset.panel, placeholder);
  }

  function dockPanel(panel, targetNode) {
    const placeholder = floatingPanels.get(panel.dataset.panel);
    if (!placeholder) {
      return;
    }

    dashboard.insertBefore(panel, targetNode || placeholder);
    placeholder.remove();
    floatingPanels.delete(panel.dataset.panel);

    panel.classList.remove("panel-detached");
    panel.style.removeProperty("width");
    panel.style.removeProperty("height");
    panel.style.removeProperty("left");
    panel.style.removeProperty("top");
    panel.style.removeProperty("z-index");
  }

  function getDockTarget(panel) {
    const panelRect = panel.getBoundingClientRect();
    const panelHeader = panel.querySelector(".panel-header");
    const panelHeaderRect = panelHeader.getBoundingClientRect();
    const candidates = [
      ...panelElements.filter((candidate) => candidate !== panel && !candidate.classList.contains("panel-detached")),
      ...Array.from(floatingPanels.values())
    ];

    return candidates.find((candidate) => {
      const rect = candidate.getBoundingClientRect();
      const candidateHeader = candidate.classList.contains("panel-placeholder")
        ? {
            top: rect.top,
            bottom: rect.top + Math.min(52, rect.height * 0.22)
          }
        : candidate.querySelector(".panel-header").getBoundingClientRect();
      const horizontalOverlap =
        Math.min(panelRect.right, rect.right) - Math.max(panelRect.left, rect.left);
      const minOverlap = Math.min(panelRect.width, rect.width) * 0.35;
      const headerCrossingTop =
        panelHeaderRect.top <= candidateHeader.top && panelHeaderRect.bottom >= candidateHeader.top;
      const headerNearTargetBand = panelHeaderRect.top <= candidateHeader.bottom;

      return horizontalOverlap >= minOverlap && headerCrossingTop && headerNearTargetBand;
    }) || null;
  }

  function dockPanelIntoTarget(panel, target) {
    dockPanel(panel, target);
  }

  function closePanel(panel) {
    const placeholder = floatingPanels.get(panel.dataset.panel);
    if (placeholder) {
      placeholder.remove();
      floatingPanels.delete(panel.dataset.panel);
    }

    const panelIndex = panelElements.indexOf(panel);
    if (panelIndex >= 0) {
      panelElements.splice(panelIndex, 1);
    }

    const instance = panel.__instance;
    if (instance) {
      if (instance.resizeObserver) {
        instance.resizeObserver.disconnect();
      }
      const animatedIndex = animatedPanels.indexOf(instance);
      if (animatedIndex >= 0) {
        animatedPanels.splice(animatedIndex, 1);
      }
    }

    panel.remove();
  }

  function startPanelDrag(panel, event) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    const wasDetached = panel.classList.contains("panel-detached");
    const startRect = panel.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerOffsetX = event.clientX - startRect.left;
    const pointerOffsetY = event.clientY - startRect.top;
    let dragging = wasDetached;

    if (wasDetached) {
      bringPanelToFront(panel);
    }

    const onMove = (moveEvent) => {
      const movedEnough =
        Math.abs(moveEvent.clientX - startX) > 6 || Math.abs(moveEvent.clientY - startY) > 6;

      if (!dragging && movedEnough) {
        undockPanel(panel);
        dragging = true;
      }

      if (!dragging) {
        return;
      }

      bringPanelToFront(panel);
      panel.style.left = `${moveEvent.clientX - pointerOffsetX}px`;
      panel.style.top = `${moveEvent.clientY - pointerOffsetY}px`;
      clampDetachedPanel(panel);

      clearDockTargets();
      const dockTarget = getDockTarget(panel);
      if (dockTarget) {
        dockTarget.classList.add("is-dock-target");
      }
    };

    const onUp = (upEvent) => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      if (dragging && floatingPanels.has(panel.dataset.panel)) {
        const dockTarget = getDockTarget(panel);
        if (dockTarget) {
          dockPanelIntoTarget(panel, dockTarget);
        }
      }
      clearDockTargets();
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  function startPanelResize(panel, event) {
    if (!panel.classList.contains("panel-detached")) {
      return;
    }

    event.preventDefault();
    const minWidth = 260;
    const minHeight = 180;
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = panel.offsetWidth;
    const startHeight = panel.offsetHeight;
    const startLeft = Number.parseFloat(panel.style.left || "0");
    const startTop = Number.parseFloat(panel.style.top || "0");
    bringPanelToFront(panel);

    const onMove = (moveEvent) => {
      const maxWidth = window.innerWidth - startLeft - 12;
      const maxHeight = window.innerHeight - startTop - 12;
      const width = clamp(startWidth + moveEvent.clientX - startX, minWidth, maxWidth);
      const height = clamp(startHeight + moveEvent.clientY - startY, minHeight, maxHeight);
      panel.style.width = `${width}px`;
      panel.style.height = `${height}px`;
    };

    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  function updateGrid() {
    dashboard.style.removeProperty("grid-template-columns");
    dashboard.style.removeProperty("grid-template-rows");
  }

  function startDrag(mode, event) {
    event.preventDefault();

    const onMove = (moveEvent) => {
      const rect = dashboard.getBoundingClientRect();

      if (mode === "vertical" || mode === "cross") {
        state.splitX = (moveEvent.clientX - rect.left) / rect.width;
      }

      if (mode === "horizontal" || mode === "cross") {
        state.splitY = (moveEvent.clientY - rect.top) / rect.height;
      }

      updateGrid();
    };

    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      verticalSplitter.classList.remove("is-dragging");
      horizontalSplitter.classList.remove("is-dragging");
      crossSplitter.classList.remove("is-dragging");
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);

    if (mode === "vertical") {
      verticalSplitter.classList.add("is-dragging");
    } else if (mode === "horizontal") {
      horizontalSplitter.classList.add("is-dragging");
    } else {
      verticalSplitter.classList.add("is-dragging");
      horizontalSplitter.classList.add("is-dragging");
      crossSplitter.classList.add("is-dragging");
    }
  }

  window.addEventListener("resize", updateGrid);
  configTab.addEventListener("click", () => {
    const isOpen = !document.body.classList.contains("drawer-open");
    setDrawerOpen(isOpen);
  });
  configClose.addEventListener("click", () => setDrawerOpen(false));
  configBackdrop.addEventListener("click", () => setDrawerOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("drawer-open")) {
      setDrawerOpen(false);
    }
  });
  themeColorPicker.addEventListener("input", (event) => {
    applyThemeColor(event.target.value);
  });
  applyThemeColor(themeColorPicker.value);
  updateGrid();
  window.addEventListener("resize", () => {
    panelElements.forEach((panel) => {
      if (panel.classList.contains("panel-detached")) {
        clampDetachedPanel(panel);
      }
    });
  });

  class CanvasPanel {
    constructor(id) {
      this.canvas = document.getElementById(id);
      this.ctx = this.canvas.getContext("2d");
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas.parentElement);
      this.resize();
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.width = Math.max(1, Math.floor(rect.width * dpr));
      this.height = Math.max(1, Math.floor(rect.height * dpr));
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      this.displayWidth = rect.width;
      this.displayHeight = rect.height;
    }
  }

  class SymbolsPanel extends CanvasPanel {
    constructor(id) {
      super(id);
      this.characters = "01<>[]{}¦¦+-*/=~!@#$%^&:;?ZXCVBNM";
      this.streams = [];
      this.seed();
    }

    seed() {
      const columnWidth = 20;
      const columns = Math.max(8, Math.floor(this.displayWidth / columnWidth));
      this.streams = Array.from({ length: columns }, (_, index) => ({
        x: index * columnWidth,
        y: Math.random() * this.displayHeight,
        speed: 0.4 + Math.random() * 1.5,
        length: 8 + Math.floor(Math.random() * 20)
      }));
    }

    resize() {
      super.resize();
      this.seed();
    }

    draw() {
      const ctx = this.ctx;
      ctx.fillStyle = "rgba(3, 0, 0, 0.22)";
      ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

      ctx.font = '15px "Share Tech Mono", monospace';
      ctx.textBaseline = "top";

      for (const stream of this.streams) {
        for (let i = 0; i < stream.length; i += 1) {
          const y = stream.y + i * 18;
          if (y < -20 || y > this.displayHeight + 20) {
            continue;
          }

          const alpha = 1 - i / stream.length;
          const char = this.characters[(Math.random() * this.characters.length) | 0];
          const glowStep = lighten(theme.base, Math.min(0.7, 0.18 + i / (stream.length * 1.35)));
          ctx.fillStyle = rgba(glowStep, 0.85 * alpha);
          ctx.fillText(char, stream.x, y);
        }

        stream.y -= stream.speed;
        if (stream.y + stream.length * 18 < 0) {
          stream.y = this.displayHeight + Math.random() * 80;
          stream.speed = 0.4 + Math.random() * 1.5;
          stream.length = 8 + Math.floor(Math.random() * 20);
        }
      }
    }
  }

  class GraphPanel extends CanvasPanel {
    constructor(id) {
      super(id);
      this.time = 0;
      this.mixA = 1.2 + Math.random() * 1.3;
      this.mixB = 0.35 + Math.random() * 0.6;
      this.mixC = 0.05 + Math.random() * 0.08;
      this.mixD = 1.8 + Math.random() * 1.5;
      this.phaseA = Math.random() * Math.PI * 2;
      this.phaseB = Math.random() * Math.PI * 2;
      this.phaseC = Math.random() * Math.PI * 2;
    }

    draw() {
      const ctx = this.ctx;
      const w = this.displayWidth;
      const h = this.displayHeight;
      this.time += 0.015;

      ctx.fillStyle = "rgba(5, 0, 0, 0.2)";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = rgba(theme.base, 0.14);
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.beginPath();
      for (let x = 0; x < w; x += 2) {
        const normalizedX = (x / w) * Math.PI * 7 - Math.PI * 3.5;
        const value =
          Math.sin(normalizedX * this.mixA + this.time * 1.8 + this.phaseA) * 0.45 +
          Math.cos(normalizedX * this.mixB - this.time * 1.15 + this.phaseB) * 0.24 +
          Math.sin((normalizedX * normalizedX) * this.mixC - this.time * 0.75 + this.phaseC) * 0.16 +
          Math.cos(normalizedX * this.mixD + Math.sin(this.time) * 2.2) * 0.1;
        const y = h * 0.5 - value * h * 0.34;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = rgb(theme.glow);
      ctx.shadowColor = rgba(theme.glow, 0.55);
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = rgba(theme.pale, 0.22);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(w, h * 0.5);
      ctx.stroke();
    }
  }

  class RadarPanel extends CanvasPanel {
    constructor(id) {
      super(id);
      this.angle = 0;
      this.targets = Array.from({ length: 14 }, () => this.makeTarget());
    }

    makeTarget() {
      const moving = Math.random() > 0.45;
      return {
        radius: Math.random() * 0.86,
        angle: Math.random() * Math.PI * 2,
        pulse: Math.random() * Math.PI * 2,
        size: 1 + Math.random() * 3,
        moving,
        angularVelocity: moving ? (Math.random() - 0.5) * 0.018 : 0,
        radialVelocity: moving ? (Math.random() - 0.5) * 0.0035 : 0
      };
    }

    draw() {
      const ctx = this.ctx;
      const w = this.displayWidth;
      const h = this.displayHeight;
      const radius = Math.min(w, h) * 0.38;
      const cx = w * 0.5;
      const cy = h * 0.5;

      ctx.fillStyle = "rgba(3, 0, 0, 0.25)";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(cx, cy);

      ctx.strokeStyle = rgba(theme.base, 0.18);
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i += 1) {
        ctx.beginPath();
        ctx.arc(0, 0, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
        ctx.stroke();
      }

      const sweepGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      sweepGradient.addColorStop(0, rgba(theme.softGlow, 0.24));
      sweepGradient.addColorStop(1, rgba(theme.base, 0));
      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, this.angle - 0.22, this.angle + 0.02);
      ctx.closePath();
      ctx.fill();

      for (const target of this.targets) {
        target.pulse += 0.045;
        if (target.moving) {
          target.angle += target.angularVelocity;
          target.radius += target.radialVelocity;

          if (target.radius > 0.92 || target.radius < 0.08) {
            target.radialVelocity *= -1;
            target.radius = clamp(target.radius, 0.08, 0.92);
          }
        }

        const tx = Math.cos(target.angle) * radius * target.radius;
        const ty = Math.sin(target.angle) * radius * target.radius;
        const intensity = 0.45 + Math.max(0, Math.cos(target.angle - this.angle)) * 0.55;
        ctx.fillStyle = rgba(theme.softGlow, 0.16 + intensity * 0.5);
        ctx.beginPath();
        ctx.arc(tx, ty, target.size + Math.sin(target.pulse) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = rgb(theme.glow);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(this.angle) * radius, Math.sin(this.angle) * radius);
      ctx.stroke();

      ctx.fillStyle = rgba(theme.text, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      this.angle += 0.018;
    }
  }

  class NumbersPanel extends CanvasPanel {
    constructor(id) {
      super(id);
      this.lines = [];
      this.populate();
    }

    randomLine() {
      return Array.from({ length: 5 + Math.floor(Math.random() * 4) }, () =>
        String(Math.floor(Math.random() * 9999)).padStart(4, "0")
      ).join(" ");
    }

    populate() {
      const lineHeight = 18;
      const total = Math.ceil(this.displayHeight / lineHeight) + 6;
      this.lines = Array.from({ length: total }, (_, index) => ({
        y: index * lineHeight,
        text: this.randomLine(),
        speed: 0.5 + Math.random() * 0.8
      }));
    }

    resize() {
      super.resize();
      this.populate();
    }

    draw() {
      const ctx = this.ctx;
      ctx.fillStyle = "rgba(4, 0, 0, 0.25)";
      ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

      ctx.font = '15px "Share Tech Mono", monospace';
      ctx.textBaseline = "top";

      for (const line of this.lines) {
        const alpha = 0.35 + (line.y / this.displayHeight) * 0.65;
        ctx.fillStyle = rgba(theme.softGlow, Math.min(alpha, 0.92));
        ctx.fillText(line.text, 14, line.y);

        line.y -= line.speed;
        if (line.y < -20) {
          line.y = this.displayHeight + Math.random() * 32;
          line.text = this.randomLine();
          line.speed = 0.5 + Math.random() * 0.8;
        }
      }
    }
  }

  class AsteroidsPanel extends CanvasPanel {
    constructor(id) {
      super(id);
      this.score = 0;
      this.cooldown = 0;
      this.ship = this.createShip();
      this.bullets = [];
      this.asteroids = [];
      this.particles = [];
      this.spawnWave();
    }

    createShip() {
      return {
        x: this.displayWidth * 0.5,
        y: this.displayHeight * 0.5,
        angle: -Math.PI / 2,
        vx: 0,
        vy: 0
      };
    }

    resetShip() {
      this.ship = this.createShip();
    }

    spawnWave() {
      const count = Math.max(4, Math.min(9, Math.floor((this.displayWidth + this.displayHeight) / 180)));
      this.asteroids = Array.from({ length: count }, () => this.createAsteroid(3));
    }

    createAsteroid(size, x, y) {
      const spawnFromEdge = x === undefined || y === undefined;
      const edge = Math.floor(Math.random() * 4);
      const px = spawnFromEdge
        ? edge === 0 ? -30 : edge === 1 ? this.displayWidth + 30 : Math.random() * this.displayWidth
        : x;
      const py = spawnFromEdge
        ? edge === 2 ? -30 : edge === 3 ? this.displayHeight + 30 : Math.random() * this.displayHeight
        : y;
      const speed = 0.6 + Math.random() * 1.25 + (3 - size) * 0.22;
      const angle = Math.random() * Math.PI * 2;
      return {
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.03,
        size,
        radius: size === 3 ? 28 : size === 2 ? 18 : 11,
        shape: Array.from({ length: 9 }, (_, index) => {
          const pointAngle = (Math.PI * 2 * index) / 9;
          return {
            angle: pointAngle,
            radius: 0.72 + Math.random() * 0.42
          };
        })
      };
    }

    resize() {
      super.resize();
      this.resetShip();
      this.bullets = [];
      this.particles = [];
      this.spawnWave();
    }

    wrap(entity, margin = 0) {
      const width = this.displayWidth;
      const height = this.displayHeight;
      if (entity.x < -margin) entity.x = width + margin;
      if (entity.x > width + margin) entity.x = -margin;
      if (entity.y < -margin) entity.y = height + margin;
      if (entity.y > height + margin) entity.y = -margin;
    }

    fireBullet() {
      const noseX = this.ship.x + Math.cos(this.ship.angle) * 14;
      const noseY = this.ship.y + Math.sin(this.ship.angle) * 14;
      this.bullets.push({
        x: noseX,
        y: noseY,
        vx: this.ship.vx + Math.cos(this.ship.angle) * 5.4,
        vy: this.ship.vy + Math.sin(this.ship.angle) * 5.4,
        life: 70
      });
      this.cooldown = 10;
    }

    shatterAsteroid(index) {
      const asteroid = this.asteroids[index];
      this.score += asteroid.size * 10;
      this.particles.push(...Array.from({ length: 10 }, () => ({
        x: asteroid.x,
        y: asteroid.y,
        vx: (Math.random() - 0.5) * 3.2,
        vy: (Math.random() - 0.5) * 3.2,
        life: 24 + Math.random() * 18
      })));

      if (asteroid.size > 1) {
        for (let i = 0; i < 2; i += 1) {
          const fragment = this.createAsteroid(asteroid.size - 1, asteroid.x, asteroid.y);
          fragment.vx += asteroid.vx * 0.4;
          fragment.vy += asteroid.vy * 0.4;
          this.asteroids.push(fragment);
        }
      }

      this.asteroids.splice(index, 1);
      if (this.asteroids.length === 0) {
        this.spawnWave();
      }
    }

    updateAutopilot() {
      if (this.asteroids.length === 0) {
        return;
      }

      let target = this.asteroids[0];
      let bestDistance = Infinity;
      for (const asteroid of this.asteroids) {
        const dx = asteroid.x - this.ship.x;
        const dy = asteroid.y - this.ship.y;
        const distance = Math.hypot(dx, dy);
        if (distance < bestDistance) {
          bestDistance = distance;
          target = asteroid;
        }
      }

      const aimX = target.x + target.vx * 10;
      const aimY = target.y + target.vy * 10;
      const desiredAngle = Math.atan2(aimY - this.ship.y, aimX - this.ship.x);
      let angleDiff = desiredAngle - this.ship.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      this.ship.angle += clamp(angleDiff, -0.055, 0.055);

      const tooClose = bestDistance < 120;
      const shouldThrust = bestDistance > 150 || tooClose;
      if (shouldThrust) {
        const thrustAngle = this.ship.angle + (tooClose ? Math.PI : 0);
        this.ship.vx += Math.cos(thrustAngle) * 0.065;
        this.ship.vy += Math.sin(thrustAngle) * 0.065;
      }

      const aligned = Math.abs(angleDiff) < 0.18;
      if (aligned && this.cooldown <= 0) {
        this.fireBullet();
      }
    }

    updateSimulation() {
      this.cooldown = Math.max(0, this.cooldown - 1);
      this.updateAutopilot();

      this.ship.x += this.ship.vx;
      this.ship.y += this.ship.vy;
      this.ship.vx *= 0.992;
      this.ship.vy *= 0.992;
      this.wrap(this.ship, 20);

      for (const asteroid of this.asteroids) {
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        asteroid.angle += asteroid.spin;
        this.wrap(asteroid, asteroid.radius + 20);
      }

      for (let bulletIndex = this.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
        const bullet = this.bullets[bulletIndex];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life -= 1;
        this.wrap(bullet, 8);

        if (bullet.life <= 0) {
          this.bullets.splice(bulletIndex, 1);
          continue;
        }

        let hit = false;
        for (let asteroidIndex = this.asteroids.length - 1; asteroidIndex >= 0; asteroidIndex -= 1) {
          const asteroid = this.asteroids[asteroidIndex];
          if (Math.hypot(bullet.x - asteroid.x, bullet.y - asteroid.y) <= asteroid.radius) {
            this.bullets.splice(bulletIndex, 1);
            this.shatterAsteroid(asteroidIndex);
            hit = true;
            break;
          }
        }

        if (hit) {
          continue;
        }
      }

      for (let particleIndex = this.particles.length - 1; particleIndex >= 0; particleIndex -= 1) {
        const particle = this.particles[particleIndex];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1;
        if (particle.life <= 0) {
          this.particles.splice(particleIndex, 1);
        }
      }
    }

    drawAsteroid(ctx, asteroid) {
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      ctx.rotate(asteroid.angle);
      ctx.beginPath();
      asteroid.shape.forEach((point, index) => {
        const px = Math.cos(point.angle) * asteroid.radius * point.radius;
        const py = Math.sin(point.angle) * asteroid.radius * point.radius;
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    drawShip(ctx) {
      ctx.save();
      ctx.translate(this.ship.x, this.ship.y);
      ctx.rotate(this.ship.angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(10, 12);
      ctx.lineTo(0, 7);
      ctx.lineTo(-10, 12);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    draw() {
      this.updateSimulation();

      const ctx = this.ctx;
      const w = this.displayWidth;
      const h = this.displayHeight;
      ctx.fillStyle = "rgba(2, 0, 0, 0.34)";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = rgba(theme.base, 0.12);
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.strokeStyle = rgba(theme.softGlow, 0.9);
      ctx.fillStyle = rgba(theme.text, 0.9);
      ctx.lineWidth = 1.7;
      this.drawShip(ctx);
      for (const asteroid of this.asteroids) {
        this.drawAsteroid(ctx, asteroid);
      }

      for (const bullet of this.bullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const particle of this.particles) {
        ctx.fillStyle = rgba(theme.glow, Math.max(0.1, particle.life / 42));
        ctx.fillRect(particle.x, particle.y, 2, 2);
      }

      ctx.fillStyle = rgba(theme.text, 0.9);
      ctx.font = '13px "Share Tech Mono", monospace';
      ctx.fillText(`AUTO SCORE ${String(this.score).padStart(4, "0")}`, 14, 18);
      ctx.fillText(`TARGETS ${String(this.asteroids.length).padStart(2, "0")}`, 14, 36);
      ctx.fillText("PILOT ENGAGED", 14, 54);
    }
  }

  class PacmanPanel extends CanvasPanel {
    constructor(id) {
      super(id);
      this.tick = 0;
      this.cellSize = 18;
      this.map = [
        "###############",
        "#.............#",
        "#.###.###.###.#",
        "#o#.......#...#",
        "#.###.#.#.###.#",
        "#.....#.#.....#",
        "#####.#.#.#####",
        "#.....#.#.....#",
        "#.###.#.#.###.#",
        "#...#.....#...#",
        "#.#.###.###.#.#",
        "#o............#",
        "###############"
      ];
      this.resetBoard();
    }

    resetBoard() {
      this.grid = this.map.map((row) => row.split(""));
      this.pacman = { x: 1, y: 1, dir: { x: 1, y: 0 }, mouth: 0 };
      this.ghosts = [
        { x: 13, y: 1, color: "#ff8a8a", step: 0 },
        { x: 13, y: 11, color: "#ffd4d4", step: 2 },
        { x: 7, y: 9, color: "#ffb0b0", step: 4 }
      ];
      this.score = 0;
      this.frightened = 0;
    }

    resize() {
      super.resize();
    }

    isWall(x, y) {
      return this.grid[y]?.[x] === "#";
    }

    neighbors(x, y) {
      return [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
      ]
        .map((dir) => ({ ...dir, nx: x + dir.x, ny: y + dir.y }))
        .filter((next) => !this.isWall(next.nx, next.ny));
    }

    findPathStep(start, target, avoidGhosts = false) {
      const queue = [{ x: start.x, y: start.y }];
      const seen = new Set([`${start.x},${start.y}`]);
      const previous = new Map();

      while (queue.length > 0) {
        const current = queue.shift();
        if (current.x === target.x && current.y === target.y) {
          break;
        }

        for (const next of this.neighbors(current.x, current.y)) {
          const key = `${next.nx},${next.ny}`;
          if (seen.has(key)) {
            continue;
          }
          if (avoidGhosts && this.ghosts.some((ghost) => ghost.x === next.nx && ghost.y === next.ny)) {
            continue;
          }
          seen.add(key);
          previous.set(key, current);
          queue.push({ x: next.nx, y: next.ny });
        }
      }

      const targetKey = `${target.x},${target.y}`;
      if (!previous.has(targetKey)) {
        return null;
      }

      let cursor = target;
      let prev = previous.get(targetKey);
      while (prev && !(prev.x === start.x && prev.y === start.y)) {
        cursor = prev;
        prev = previous.get(`${prev.x},${prev.y}`);
      }

      return { x: cursor.x - start.x, y: cursor.y - start.y };
    }

    choosePacmanMove() {
      const pellets = [];
      for (let y = 0; y < this.grid.length; y += 1) {
        for (let x = 0; x < this.grid[y].length; x += 1) {
          if (this.grid[y][x] === "." || this.grid[y][x] === "o") {
            pellets.push({ x, y });
          }
        }
      }

      if (pellets.length === 0) {
        this.resetBoard();
        return { x: 0, y: 0 };
      }

      const dangerousGhost = this.ghosts.find(
        (ghost) => Math.abs(ghost.x - this.pacman.x) + Math.abs(ghost.y - this.pacman.y) < 3
      );

      if (dangerousGhost && this.frightened <= 0) {
        const safeMoves = this.neighbors(this.pacman.x, this.pacman.y).sort((a, b) => {
          const da = Math.abs(a.nx - dangerousGhost.x) + Math.abs(a.ny - dangerousGhost.y);
          const db = Math.abs(b.nx - dangerousGhost.x) + Math.abs(b.ny - dangerousGhost.y);
          return db - da;
        });
        if (safeMoves[0]) {
          return { x: safeMoves[0].x, y: safeMoves[0].y };
        }
      }

      let bestPellet = pellets[0];
      let bestDistance = Infinity;
      for (const pellet of pellets) {
        const distance = Math.abs(pellet.x - this.pacman.x) + Math.abs(pellet.y - this.pacman.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPellet = pellet;
        }
      }

      return this.findPathStep(this.pacman, bestPellet, true) || this.pacman.dir;
    }

    movePacman() {
      const move = this.choosePacmanMove();
      const nextX = this.pacman.x + move.x;
      const nextY = this.pacman.y + move.y;
      if (!this.isWall(nextX, nextY)) {
        this.pacman.x = nextX;
        this.pacman.y = nextY;
        this.pacman.dir = move;
      }

      const tile = this.grid[this.pacman.y][this.pacman.x];
      if (tile === ".") {
        this.grid[this.pacman.y][this.pacman.x] = " ";
        this.score += 10;
      } else if (tile === "o") {
        this.grid[this.pacman.y][this.pacman.x] = " ";
        this.score += 50;
        this.frightened = 90;
      }
    }

    moveGhosts() {
      for (const ghost of this.ghosts) {
        const options = this.neighbors(ghost.x, ghost.y);
        options.sort((a, b) => {
          const da = Math.abs(a.nx - this.pacman.x) + Math.abs(a.ny - this.pacman.y);
          const db = Math.abs(b.nx - this.pacman.x) + Math.abs(b.ny - this.pacman.y);
          return this.frightened > 0 ? db - da : da - db;
        });
        const choice = options[ghost.step % Math.max(1, options.length)] || options[0];
        ghost.step += 1;
        if (choice) {
          ghost.x = choice.nx;
          ghost.y = choice.ny;
        }
      }
    }

    handleCollisions() {
      for (const ghost of this.ghosts) {
        if (ghost.x === this.pacman.x && ghost.y === this.pacman.y) {
          if (this.frightened > 0) {
            ghost.x = 7;
            ghost.y = 6;
            this.score += 200;
          } else {
            this.resetBoard();
            return;
          }
        }
      }
    }

    updateSimulation() {
      this.tick += 1;
      this.pacman.mouth += 0.22;
      if (this.tick % 6 === 0) {
        this.movePacman();
        this.handleCollisions();
      }
      if (this.tick % 8 === 0) {
        this.moveGhosts();
        this.handleCollisions();
      }
      this.frightened = Math.max(0, this.frightened - 1);
    }

    drawMaze(ctx, offsetX, offsetY, cell) {
      for (let y = 0; y < this.grid.length; y += 1) {
        for (let x = 0; x < this.grid[y].length; x += 1) {
          const tile = this.grid[y][x];
          const px = offsetX + x * cell;
          const py = offsetY + y * cell;
          if (tile === "#") {
            ctx.strokeStyle = rgba(theme.base, 0.9);
            ctx.strokeRect(px + 1, py + 1, cell - 2, cell - 2);
          } else if (tile === ".") {
            ctx.fillStyle = rgba(theme.text, 0.9);
            ctx.beginPath();
            ctx.arc(px + cell * 0.5, py + cell * 0.5, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile === "o") {
            ctx.fillStyle = rgba(theme.glow, 0.95);
            ctx.beginPath();
            ctx.arc(px + cell * 0.5, py + cell * 0.5, cell * 0.16, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    draw() {
      this.updateSimulation();

      const ctx = this.ctx;
      const w = this.displayWidth;
      const h = this.displayHeight;
      ctx.fillStyle = "rgba(2, 0, 0, 0.34)";
      ctx.fillRect(0, 0, w, h);

      const cols = this.grid[0].length;
      const rows = this.grid.length;
      const cell = Math.max(10, Math.min((w - 30) / cols, (h - 46) / rows));
      const mazeWidth = cols * cell;
      const mazeHeight = rows * cell;
      const offsetX = (w - mazeWidth) * 0.5;
      const offsetY = (h - mazeHeight) * 0.5 + 8;

      this.drawMaze(ctx, offsetX, offsetY, cell);

      const mouth = (Math.sin(this.pacman.mouth) + 1) * 0.22;
      const pacX = offsetX + (this.pacman.x + 0.5) * cell;
      const pacY = offsetY + (this.pacman.y + 0.5) * cell;
      const pacAngle = Math.atan2(this.pacman.dir.y, this.pacman.dir.x);
      ctx.fillStyle = rgba(theme.softGlow, 0.95);
      ctx.beginPath();
      ctx.moveTo(pacX, pacY);
      ctx.arc(
        pacX,
        pacY,
        cell * 0.42,
        pacAngle + mouth,
        pacAngle + Math.PI * 2 - mouth
      );
      ctx.closePath();
      ctx.fill();

      for (const ghost of this.ghosts) {
        const gx = offsetX + (ghost.x + 0.5) * cell;
        const gy = offsetY + (ghost.y + 0.55) * cell;
        const ghostColor = this.frightened > 0 ? rgba(theme.base, 0.95) : ghost.color;
        ctx.fillStyle = ghostColor;
        ctx.beginPath();
        ctx.arc(gx, gy - cell * 0.12, cell * 0.34, Math.PI, 0);
        ctx.lineTo(gx + cell * 0.34, gy + cell * 0.26);
        ctx.lineTo(gx + cell * 0.14, gy + cell * 0.12);
        ctx.lineTo(gx, gy + cell * 0.26);
        ctx.lineTo(gx - cell * 0.14, gy + cell * 0.12);
        ctx.lineTo(gx - cell * 0.34, gy + cell * 0.26);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = rgba(theme.text, 0.92);
      ctx.font = '13px "Share Tech Mono", monospace';
      ctx.fillText(`AUTO SCORE ${String(this.score).padStart(4, "0")}`, 14, 18);
      ctx.fillText(`POWER ${String(this.frightened).padStart(3, "0")}`, 14, 36);
    }
  }

  function registerPanel(panel) {
    if (panelElements.includes(panel)) {
      return;
    }

    panelElements.push(panel);
    const header = panel.querySelector(".panel-header");
    const closeButton = panel.querySelector(".panel-close");
    const resizeHandle = panel.querySelector(".panel-resize-handle");
    header.addEventListener("pointerdown", (event) => startPanelDrag(panel, event));
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      closePanel(panel);
    });
    resizeHandle.addEventListener("pointerdown", (event) => startPanelResize(panel, event));
    panel.addEventListener("pointerdown", () => {
      if (panel.classList.contains("panel-detached")) {
        bringPanelToFront(panel);
      }
    });

    const canvas = panel.querySelector("canvas");
    const visual = panel.dataset.visual;
    let instance = null;

    if (visual === "symbols") {
      instance = new SymbolsPanel(canvas.id);
    } else if (visual === "graph" || visual === "function") {
      instance = new GraphPanel(canvas.id);
    } else if (visual === "radar") {
      instance = new RadarPanel(canvas.id);
    } else if (visual === "numbers") {
      instance = new NumbersPanel(canvas.id);
    } else if (visual === "asteroids") {
      instance = new AsteroidsPanel(canvas.id);
    } else if (visual === "pacman") {
      instance = new PacmanPanel(canvas.id);
    }

    if (instance) {
      panel.__instance = instance;
      animatedPanels.push(instance);
    }
  }

  function createFunctionPanel() {
    functionPanelCount += 1;
    const panelId = `function-${functionPanelCount}`;
    const canvasId = `${panelId}-canvas`;
    const panel = document.createElement("section");
    panel.className = "panel panel-graph";
    panel.dataset.panel = panelId;
    panel.dataset.visual = "function";
    panel.innerHTML = `
      <div class="panel-header">
        <span>Function Trace ${String(functionPanelCount).padStart(2, "0")}</span>
        <div class="panel-actions">
          <span class="panel-tag">F${functionPanelCount}</span>
          <button class="panel-close" type="button" aria-label="Close panel">X</button>
          <button class="panel-toggle" type="button">Undock</button>
        </div>
      </div>
      <div class="panel-body">
        <canvas id="${canvasId}"></canvas>
      </div>
      <div class="panel-resize-handle" aria-hidden="true"></div>
    `;
    dashboard.appendChild(panel);
    registerPanel(panel);
  }

  function createAsteroidsPanel() {
    asteroidsPanelCount += 1;
    const panelId = `asteroids-${asteroidsPanelCount}`;
    const canvasId = `${panelId}-canvas`;
    const panel = document.createElement("section");
    panel.className = "panel panel-radar";
    panel.dataset.panel = panelId;
    panel.dataset.visual = "asteroids";
    panel.innerHTML = `
      <div class="panel-header">
        <span>Auto Asteroids ${String(asteroidsPanelCount).padStart(2, "0")}</span>
        <div class="panel-actions">
          <span class="panel-tag">AX${asteroidsPanelCount}</span>
          <button class="panel-close" type="button" aria-label="Close panel">X</button>
          <button class="panel-toggle" type="button">Undock</button>
        </div>
      </div>
      <div class="panel-body">
        <canvas id="${canvasId}"></canvas>
      </div>
      <div class="panel-resize-handle" aria-hidden="true"></div>
    `;
    dashboard.appendChild(panel);
    registerPanel(panel);
  }

  function createPacmanPanel() {
    pacmanPanelCount += 1;
    const panelId = `pacman-${pacmanPanelCount}`;
    const canvasId = `${panelId}-canvas`;
    const panel = document.createElement("section");
    panel.className = "panel panel-numbers";
    panel.dataset.panel = panelId;
    panel.dataset.visual = "pacman";
    panel.innerHTML = `
      <div class="panel-header">
        <span>Auto Pacman ${String(pacmanPanelCount).padStart(2, "0")}</span>
        <div class="panel-actions">
          <span class="panel-tag">PX${pacmanPanelCount}</span>
          <button class="panel-close" type="button" aria-label="Close panel">X</button>
          <button class="panel-toggle" type="button">Undock</button>
        </div>
      </div>
      <div class="panel-body">
        <canvas id="${canvasId}"></canvas>
      </div>
      <div class="panel-resize-handle" aria-hidden="true"></div>
    `;
    dashboard.appendChild(panel);
    registerPanel(panel);
  }

  document.querySelectorAll(".panel").forEach((panel) => registerPanel(panel));
  addFunctionPanelButton.addEventListener("click", createFunctionPanel);
  addAsteroidsPanelButton.addEventListener("click", createAsteroidsPanel);
  addPacmanPanelButton.addEventListener("click", createPacmanPanel);

  function animate() {
    for (const panel of animatedPanels) {
      panel.draw();
    }
    requestAnimationFrame(animate);
  }

  animate();
})();
