(function () {
  const width = 58;
  const height = 58;
  const accent = [72, 213, 255];
  const glow = [198, 244, 255];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function hexToRgb(value, fallback) {
    if (typeof value !== "string") {
      return fallback;
    }

    const normalized = value.trim().replace(/^#/, "");
    const hex = normalized.length === 3
      ? normalized.split("").map((char) => `${char}${char}`).join("")
      : normalized;

    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
      return fallback;
    }

    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16)
    ];
  }

  function getLogoSettings(rawValue) {
    const defaults = {
      shared: {
        backgroundColor: "#000000",
        foregroundColor: "#ffffff",
        speedMultiplier: 1,
        lineThickness: 2.4,
        glowIntensity: 0.65
      },
      signal: {
        traceSpeed: 1,
        amplitude: 1,
        gridEnabled: true,
        gridOpacity: 0.35
      },
      bars: {
        count: 22,
        speed: 1,
        amplitude: 1,
        barWidth: 3.2
      },
      radar: {
        sweepSpeed: 1,
        trailLength: 12,
        beamWidth: 4
      },
      gSpin: {
        text: "GG",
        fontSize: 35,
        speed: 1
      },
      dual: {
        fontSize: 29,
        changeIntervalMin: 45,
        changeIntervalMax: 100,
        allowVerticalAxis: true,
        allowHorizontalAxis: true
      },
      face: {
        color: "#ffffff",
        minVisibleFrames: 1800,
        halfPeekProbability: 0.22,
        hatProbability: 0.32,
        talkProbability: 0.42,
        blinkModeProbability: 0.18
      }
    };

    try {
      const parsed = JSON.parse(rawValue || "{}");
      return {
        shared: { ...defaults.shared, ...(parsed.shared || {}) },
        signal: { ...defaults.signal, ...(parsed.signal || {}) },
        bars: { ...defaults.bars, ...(parsed.bars || {}) },
        radar: { ...defaults.radar, ...(parsed.radar || {}) },
        gSpin: { ...defaults.gSpin, ...(parsed.gSpin || {}) },
        dual: { ...defaults.dual, ...(parsed.dual || {}) },
        face: { ...defaults.face, ...(parsed.face || {}) }
      };
    } catch (error) {
      return defaults;
    }
  }

  function createSignalFamily() {
    const offset = Math.random() * Math.PI * 2;
    const variants = [
      {
        speed: 0.02,
        sample(x, t) {
          return (
            Math.sin((x * 2.1) + t + offset) * 0.72 +
            Math.cos((x * 5.1) - (t * 0.85)) * 0.18
          );
        }
      },
      {
        speed: 0.025,
        sample(x, t) {
          return (
            Math.sin((x * 2.8) - (t * 1.18) + offset) * 0.58 +
            Math.sin((x * 6.4) + (t * 0.4)) * 0.16
          );
        }
      },
      {
        speed: 0.048,
        sample(x, t) {
          return (
            Math.sin((x * 1.4) + (t * 0.92) + offset) * 0.64 +
            Math.cos((x * 4.7) - (t * 1.1)) * 0.2
          );
        }
      }
    ];

    return variants[Math.floor(Math.random() * variants.length)];
  }

  function getAllowedAxes(settings) {
    const axes = [];

    if (settings.allowVerticalAxis !== false) {
      axes.push("vertical");
    }

    if (settings.allowHorizontalAxis !== false) {
      axes.push("horizontal");
    }

    return axes.length > 0 ? axes : ["vertical"];
  }

  function getRandomInterval(settings) {
    const min = clamp(Math.round(Number(settings.changeIntervalMin) || 45), 10, 300);
    const max = clamp(Math.round(Number(settings.changeIntervalMax) || 100), min, 300);
    return min + Math.floor(Math.random() * ((max - min) + 1));
  }

  function createRandomSpinState(settings) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    const allowedAxes = getAllowedAxes(settings);
    return {
      angle: Math.random() * Math.PI * 2,
      axis: allowedAxes[Math.floor(Math.random() * allowedAxes.length)],
      direction,
      speed: 0.014 + (Math.random() * 0.014),
      nextChangeFrame: getRandomInterval(settings)
    };
  }

  function updateRandomSpin(state, frameCount, settings, speedMultiplier) {
    if (frameCount >= state.nextChangeFrame) {
      const allowedAxes = getAllowedAxes(settings);
      state.direction = Math.random() < 0.5 ? -1 : 1;
      state.axis = allowedAxes[Math.floor(Math.random() * allowedAxes.length)];
      state.speed = 0.014 + (Math.random() * 0.014);
      state.nextChangeFrame = frameCount + getRandomInterval(settings);
    }

    state.angle += state.speed * state.direction * speedMultiplier;

    return {
      angle: state.angle,
      axis: state.axis
    };
  }

  function getPeekFaceEyeState(cycleFrame, openStart, winkStart, winkEnd, state) {
    if (cycleFrame < openStart) {
      return { left: "closed", right: "closed" };
    }

    if (cycleFrame < winkStart) {
      return { left: "open", right: "open" };
    }

    if (state.blinkMode) {
      const blinkWindow = cycleFrame - winkStart;
      const blinkInterval = 22;
      const blinkFrame = blinkWindow % blinkInterval;
      const isClosed = blinkFrame < 4;
      return isClosed
        ? { left: "closed", right: "closed" }
        : { left: "open", right: "open" };
    }

    if (cycleFrame < winkEnd) {
      return { left: "wink", right: "open" };
    }

    return { left: "open", right: "open" };
  }

  function getPeekFaceMouthState(cycleFrame, openStart, slideOutStart, state) {
    if (cycleFrame < openStart || cycleFrame >= slideOutStart || !state.talkMode) {
      return "smile";
    }

    const talkWindow = cycleFrame - openStart;
    const talkFrame = talkWindow % 28;
    if (talkFrame < 8) {
      return state.talkShape;
    }

    return "smile";
  }

  function easeInOutCubic(value) {
    if (value < 0.5) {
      return 4 * value * value * value;
    }

    return 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function pickPeekFaceSide() {
    const sides = ["top", "right", "bottom", "left"];
    return sides[Math.floor(Math.random() * sides.length)];
  }

  function getPeekFaceHiddenPosition(side, shownX, shownY) {
    switch (side) {
      case "top":
        return { x: shownX, y: -16 };
      case "right":
        return { x: width + 16, y: shownY };
      case "left":
        return { x: -16, y: shownY };
      case "bottom":
      default:
        return { x: shownX, y: height + 16 };
    }
  }

  function resetPeekFaceTarget(state, settings) {
    const fullyShownX = width * 0.5;
    const fullyShownY = height * 0.56;
    const halfPeek = Math.random() < clamp(Number(settings.halfPeekProbability) || 0.22, 0, 1);

    state.showHat = Math.random() < clamp(Number(settings.hatProbability) || 0.32, 0, 1);
    state.talkMode = Math.random() < clamp(Number(settings.talkProbability) || 0.42, 0, 1);
    state.talkShape = Math.random() < 0.5 ? "o" : "line";

    if (!halfPeek) {
      state.shownX = fullyShownX;
      state.shownY = fullyShownY;
      return;
    }

    switch (state.side) {
      case "top":
        state.shownX = fullyShownX;
        state.shownY = 3;
        break;
      case "right":
        state.shownX = width - 3;
        state.shownY = fullyShownY;
        break;
      case "left":
        state.shownX = 3;
        state.shownY = fullyShownY;
        break;
      case "bottom":
      default:
        state.shownX = fullyShownX;
        state.shownY = height - 3;
        break;
    }
  }

  function resetPeekFaceTimings(state, slideInEnd, cycleLength, settings) {
    const openDelay = 12 + Math.floor(Math.random() * 14);
    const winkDelay = 18 + Math.floor(Math.random() * 42);
    const minVisibleDuration = clamp(Math.round(Number(settings.minVisibleFrames) || 1800), 60, 3600);
    const extraVisibleDelay = Math.floor(Math.random() * 320);
    const disappearDelay = 18 + Math.floor(Math.random() * 36);
    const maxSlideOutStart = cycleLength - 60;

    state.blinkMode = Math.random() < clamp(Number(settings.blinkModeProbability) || 0.18, 0, 1);

    state.openStart = slideInEnd + openDelay;
    state.winkStart = Math.min(state.openStart + winkDelay, maxSlideOutStart - 18);
    state.winkEnd = Math.min(
      state.winkStart + (state.blinkMode ? 150 : 14 + Math.floor(Math.random() * 10)),
      maxSlideOutStart - 8
    );
    state.slideOutStart = Math.min(
      Math.max(state.winkEnd + disappearDelay, slideInEnd + minVisibleDuration + extraVisibleDelay),
      maxSlideOutStart
    );
  }

  function createPeekFaceState(settings) {
    const cycleLength = Math.max(360, clamp(Math.round(Number(settings.minVisibleFrames) || 1800), 60, 3600) + 480);
    const state = {
      side: pickPeekFaceSide(),
      shownX: width * 0.5,
      shownY: height * 0.56,
      showHat: false,
      talkMode: false,
      talkShape: "o",
      blinkMode: false,
      openStart: 104,
      winkStart: 138,
      winkEnd: 162,
      slideOutStart: 182,
      cycleLength
    };

    resetPeekFaceTarget(state, settings);
    resetPeekFaceTimings(state, 88, cycleLength, settings);
    return state;
  }

  function drawPolyline(p, points, r, g, b, alpha, weight) {
    p.stroke(r, g, b, alpha);
    p.strokeWeight(weight);
    for (let i = 1; i < points.length; i += 1) {
      const previous = points[i - 1];
      const current = points[i];
      p.line(previous.x, previous.y, current.x, current.y);
    }
  }

  function mountSketch(canvasHost) {
    if (!canvasHost || canvasHost.dataset.logoMounted === "true" || prefersReducedMotion.matches || typeof window.p5 !== "function") {
      return false;
    }

    canvasHost.dataset.logoMounted = "true";
    const animationMode = ["signal", "bars", "radar", "g-spin", "gg-dual-spin", "peek-face"].includes(canvasHost.dataset.logoAnimationMode)
      ? canvasHost.dataset.logoAnimationMode
      : "signal";
    const logoSettings = getLogoSettings(canvasHost.dataset.logoSettings);
    const backgroundColor = hexToRgb(logoSettings.shared.backgroundColor, [0, 0, 0]);
    const foregroundColor = hexToRgb(logoSettings.shared.foregroundColor, [255, 255, 255]);
    const faceColor = hexToRgb(logoSettings.face.color, [255, 255, 255]);
    const sharedSpeed = clamp(Number(logoSettings.shared.speedMultiplier) || 1, 0.25, 3);
    const sharedLineThickness = clamp(Number(logoSettings.shared.lineThickness) || 2.4, 1, 8);
    const sharedGlowIntensity = clamp(Number(logoSettings.shared.glowIntensity) || 0.65, 0, 1);
    const signalFamily = createSignalFamily();
    const dualSpinState = {
      left: createRandomSpinState(logoSettings.dual),
      right: createRandomSpinState(logoSettings.dual)
    };
    const peekFaceState = createPeekFaceState(logoSettings.face);

    new window.p5((p) => {
      p.setup = function () {
        p.createCanvas(width, height).parent(canvasHost);
        p.pixelDensity(1);
        p.noFill();
        p.textAlign(p.CENTER, p.CENTER);
      };

      function drawBackground(instance, showGrid) {
        instance.noStroke();
        instance.fill(backgroundColor[0], backgroundColor[1], backgroundColor[2], 255);
        instance.rect(0, 0, width, height, 10);

        if (!showGrid) {
          return;
        }

        const gridOpacity = clamp(Number(logoSettings.signal.gridOpacity) || 0.35, 0, 1);
        instance.stroke(accent[0], accent[1], accent[2], 10 + (gridOpacity * 46));
        instance.strokeWeight(0.45 + (sharedLineThickness * 0.12));
        for (let x = 5; x < width; x += 8) {
          instance.line(x, 3.5, x, height - 3.5);
        }
        for (let y = 6; y < height; y += 7) {
          instance.line(3.5, y, width - 3.5, y);
        }
      }

      function drawSignalTrace(instance) {
        const traceSpeed = clamp(Number(logoSettings.signal.traceSpeed) || 1, 0.1, 3);
        const amplitudeMultiplier = clamp(Number(logoSettings.signal.amplitude) || 1, 0.2, 2);
        const glowAlphaBoost = 0.45 + (sharedGlowIntensity * 0.95);
        const accentWeight = 2.8 + (sharedLineThickness * 1.35);
        const glowWeight = 1.1 + (sharedLineThickness * 0.55);
        const t = instance.frameCount * signalFamily.speed * traceSpeed * sharedSpeed;
        const sweep = (instance.frameCount * 0.014 * traceSpeed * sharedSpeed) % 1;
        const pulse = (Math.sin(t * 2.3) + 1) * 0.5;

        const points = [];
        for (let i = 0; i <= 34; i += 1) {
          const x = i / 34;
          const wave = signalFamily.sample(x, t);
          points.push({
            x: 4 + (x * (width - 8)),
            y: (height * 0.5) + (wave * (height * 0.22) * amplitudeMultiplier)
          });
        }

        instance.noStroke();
        const sweepX = 4 + (sweep * (width - 8));
        instance.fill(glow[0], glow[1], glow[2], (26 + (pulse * 18)) * glowAlphaBoost);
        instance.rect(sweepX - (1.8 + (sharedLineThickness * 0.5)), 4, 3.6 + sharedLineThickness, height - 8, 3);

        for (let i = 2; i < points.length - 2; i += 2) {
          const point = points[i];
          const amplitude = Math.abs((height * 0.5) - point.y);
          const barHeight = Math.max(4, amplitude * (1.5 + (pulse * 0.4)));
          instance.fill(accent[0], accent[1], accent[2], 42 * glowAlphaBoost);
          instance.rect(point.x - (sharedLineThickness * 0.32), (height * 0.5) - (barHeight * 0.5), sharedLineThickness * 0.64, barHeight, 1);
        }

        drawPolyline(instance, points, accent[0], accent[1], accent[2], 70 * glowAlphaBoost, accentWeight + 3.4);
        drawPolyline(instance, points, glow[0], glow[1], glow[2], Math.min(255, 160 + (sharedGlowIntensity * 95)), glowWeight);

        const activePoint = points[Math.max(1, Math.min(points.length - 2, Math.floor(sweep * (points.length - 1))))];
        instance.noStroke();
        instance.fill(glow[0], glow[1], glow[2], (50 + (pulse * 30)) * glowAlphaBoost);
        instance.circle(activePoint.x, activePoint.y, 10 + (sharedLineThickness * 2.1));
        instance.fill(accent[0], accent[1], accent[2], (42 + (pulse * 20)) * glowAlphaBoost);
        instance.circle(activePoint.x, activePoint.y, 5.5 + (sharedLineThickness * 1.05));
        instance.fill(255, 236, 220, 255);
        instance.circle(activePoint.x, activePoint.y, 3);
      }

      function drawSineBars(instance) {
        const barCount = clamp(Math.round(Number(logoSettings.bars.count) || 22), 8, 40);
        const barSpeed = clamp(Number(logoSettings.bars.speed) || 1, 0.1, 3);
        const amplitude = height * 0.28 * clamp(Number(logoSettings.bars.amplitude) || 1, 0.2, 2);
        const barWidth = clamp(Number(logoSettings.bars.barWidth) || 3.2, 1, 12);
        const glowAlphaBoost = 0.45 + (sharedGlowIntensity * 0.95);
        const t = instance.frameCount * 0.035 * barSpeed * sharedSpeed;
        const baseline = height * 0.5;
        const usableWidth = width - 10;
        const step = usableWidth / barCount;

        for (let i = 0; i < barCount; i += 1) {
          const xNorm = i / (barCount - 1);
          const x = 5 + (i * step);
          const wave = Math.sin((xNorm * Math.PI * 2.2) + t);
          const innerWave = Math.sin((xNorm * Math.PI * 6) - (t * 1.35)) * 0.18;
          const value = wave + innerWave;
          const barHeight = Math.max(8, Math.abs(value) * amplitude * 2.2);
          const y = baseline - (barHeight * 0.5);
          const alpha = 110 + ((value + 1) * 60);

          const outerWidth = Math.min(step * 0.92, barWidth * 1.75);
          const coreWidth = Math.min(step * 0.72, barWidth);
          const highlightWidth = Math.min(step * 0.28, Math.max(0.8, barWidth * 0.34));

          instance.noStroke();
          instance.fill(accent[0], accent[1], accent[2], alpha * 0.42 * glowAlphaBoost);
          instance.rect(x - (outerWidth * 0.5), y - 3, outerWidth, barHeight + 6, Math.min(outerWidth * 0.45, 1.8));

          instance.fill(glow[0], glow[1], glow[2], Math.min(255, alpha * glowAlphaBoost));
          instance.rect(x - (coreWidth * 0.5), y, coreWidth, barHeight, Math.min(coreWidth * 0.45, 1.4));

          instance.fill(255, 230, 214, Math.min(255, (alpha + 24) * glowAlphaBoost));
          instance.rect(x - (highlightWidth * 0.5), y + 1, highlightWidth, Math.max(4, barHeight - 2), Math.min(highlightWidth * 0.45, 1));
        }

        instance.stroke(glow[0], glow[1], glow[2], 110 + (sharedGlowIntensity * 120));
        instance.strokeWeight(Math.max(1, sharedLineThickness * 0.42));
        instance.line(4, baseline, width - 4, baseline);
      }

      function drawRadarSweep(instance) {
        const cx = width * 0.5;
        const cy = height * 0.5;
        const radius = Math.min(width, height) * 0.38;
        const trailSteps = clamp(Math.round(Number(logoSettings.radar.trailLength) || 12), 2, 24);
        const beamWidth = clamp(Number(logoSettings.radar.beamWidth) || 4, 1, 20);
        const glowAlphaBoost = 0.45 + (sharedGlowIntensity * 0.95);
        const angle = (instance.frameCount * 0.045 * clamp(Number(logoSettings.radar.sweepSpeed) || 1, 0.1, 3) * sharedSpeed) - (Math.PI * 0.5);

        instance.noFill();
        instance.stroke(accent[0], accent[1], accent[2], 24 + (sharedGlowIntensity * 34));
        instance.strokeWeight(Math.max(0.9, sharedLineThickness * 0.4));
        instance.circle(cx, cy, radius * 2);
        instance.circle(cx, cy, radius * 1.36);
        instance.circle(cx, cy, radius * 0.72);
        instance.line(cx - radius, cy, cx + radius, cy);
        instance.line(cx, cy - radius, cx, cy + radius);

        for (let i = trailSteps; i >= 0; i -= 1) {
          const t = i / trailSteps;
          const trailAngle = angle - (t * 0.9);
          const alpha = 10 + ((1 - t) * 120);
          const x = cx + (Math.cos(trailAngle) * radius);
          const y = cy + (Math.sin(trailAngle) * radius);
          instance.stroke(glow[0], glow[1], glow[2], alpha * glowAlphaBoost);
          instance.strokeWeight(Math.max(1, (beamWidth * 0.32) + ((1 - t) * beamWidth * 0.2)));
          instance.line(cx, cy, x, y);
        }

        const sweepX = cx + (Math.cos(angle) * radius);
        const sweepY = cy + (Math.sin(angle) * radius);
        instance.noStroke();
        instance.fill(glow[0], glow[1], glow[2], 52 * glowAlphaBoost);
        instance.circle(sweepX, sweepY, 6 + beamWidth);
        instance.fill(255, 235, 220, 255);
        instance.circle(sweepX, sweepY, 3);

        const blipAngle = angle - 0.55;
        const blipRadius = radius * 0.62;
        const blipX = cx + (Math.cos(blipAngle) * blipRadius);
        const blipY = cy + (Math.sin(blipAngle) * blipRadius);
        instance.fill(accent[0], accent[1], accent[2], 110 * glowAlphaBoost);
        instance.circle(blipX, blipY, 2.8 + (beamWidth * 0.35));
      }

      function drawSpinningG(instance) {
        const cx = width * 0.5;
        const cy = height * 0.5;
        const angle = instance.frameCount * 0.022 * clamp(Number(logoSettings.gSpin.speed) || 1, 0.1, 3) * sharedSpeed;
        const horizontalScale = Math.cos(angle);
        const depthSkew = Math.sin(angle) * 0.22;
        const glowOffset = Math.sin(angle) * 1.2;
        const label = String(logoSettings.gSpin.text || "GG");
        const fontSize = clamp(Math.round(Number(logoSettings.gSpin.fontSize) || 35), 16, 42);

        instance.noStroke();
        instance.fill(backgroundColor[0], backgroundColor[1], backgroundColor[2], 255);
        instance.rect(0, 0, width, height, 10);

        instance.push();
        instance.translate(cx, cy);
        instance.applyMatrix(horizontalScale, 0, depthSkew, 1, 0, 0);
        instance.fill(foregroundColor[0], foregroundColor[1], foregroundColor[2], 24);
        instance.textSize(fontSize);
        instance.textStyle(instance.BOLD);
        instance.text(label, glowOffset, 1.2);
        instance.fill(foregroundColor[0], foregroundColor[1], foregroundColor[2], 255);
        instance.text(label, 0, 0);
        instance.pop();
      }

      function drawIndependentG(instance, x, y, spin) {
        const scale = Math.cos(spin.angle);
        const depthSkew = Math.sin(spin.angle) * 0.2;
        const glowOffset = Math.sin(spin.angle) * 0.9;
        const fontSize = clamp(Math.round(Number(logoSettings.dual.fontSize) || 29), 14, 36);

        instance.push();
        instance.translate(x, y);

        if (spin.axis === "horizontal") {
          instance.applyMatrix(1, depthSkew, 0, scale, 0, 0);
        } else {
          instance.applyMatrix(scale, 0, depthSkew, 1, 0, 0);
        }

        instance.fill(foregroundColor[0], foregroundColor[1], foregroundColor[2], 22);
        instance.textSize(fontSize);
        instance.textStyle(instance.BOLD);

        if (spin.axis === "horizontal") {
          instance.text("G", 0, 1.1 + glowOffset);
        } else {
          instance.text("G", glowOffset, 1.1);
        }

        instance.fill(foregroundColor[0], foregroundColor[1], foregroundColor[2], 255);
        instance.text("G", 0, 0);
        instance.pop();
      }

      function drawDualSpinningGG(instance) {
        const cy = height * 0.5;
        const leftX = width * 0.34;
        const rightX = width * 0.66;
        const leftSpin = updateRandomSpin(dualSpinState.left, instance.frameCount, logoSettings.dual, sharedSpeed);
        const rightSpin = updateRandomSpin(dualSpinState.right, instance.frameCount, logoSettings.dual, sharedSpeed);

        instance.noStroke();
        instance.fill(backgroundColor[0], backgroundColor[1], backgroundColor[2], 255);
        instance.rect(0, 0, width, height, 10);

        drawIndependentG(instance, leftX, cy, leftSpin);
        drawIndependentG(instance, rightX, cy, rightSpin);
      }

      function drawPeekFaceEye(instance, x, y, state) {
        instance.push();
        instance.translate(x, y);
        instance.stroke(0, 0, 0, 255);
        instance.strokeWeight(1.7);

        if (state === "closed") {
          instance.line(-2.3, 0, 2.3, 0);
        } else if (state === "wink") {
          instance.line(-2.1, 0.2, 2.1, -0.2);
        } else {
          instance.noStroke();
          instance.fill(0, 0, 0, 255);
          instance.ellipse(0, 0, 3.1, 5.9);
        }

        instance.pop();
      }

      function drawPeekFaceHat(instance) {
        instance.noStroke();
        instance.fill(18, 18, 22, 255);
        instance.rect(-9, -15, 18, 4.8, 2);
        instance.rect(-5.5, -22, 11, 8, 2);
        instance.fill(210, 72, 72, 255);
        instance.rect(-5.5, -16.1, 11, 2.1, 1.2);
      }

      function drawPeekFaceSpeechBubble(instance) {
        instance.noStroke();
        instance.fill(255, 255, 255, 245);
        instance.rect(4.5, -20.5, 12, 8.5, 4);
        instance.triangle(7.5, -12.5, 10.2, -12.5, 8.4, -9.2);
        instance.fill(0, 0, 0, 255);
        instance.circle(8.2, -16.4, 1.15);
        instance.circle(10.5, -16.4, 1.15);
        instance.circle(12.8, -16.4, 1.15);
      }

      function drawPeekFaceMouth(instance, state) {
        instance.stroke(0, 0, 0, 255);
        instance.strokeWeight(1.6);

        if (state === "o") {
          instance.noFill();
          instance.ellipse(0, 2.7, 4.8, 6);
          return;
        }

        if (state === "line") {
          instance.line(-3.2, 2.5, 3.2, 2.5);
          return;
        }

        instance.noFill();
        instance.arc(0, 2.2, 9.5, 6.5, 0.15, Math.PI - 0.15);
      }

      function drawPeekFace(instance) {
        const cycleLength = Math.max(360, clamp(Math.round(Number(logoSettings.face.minVisibleFrames) || 1800), 60, 3600) + 480);
        const cycleFrame = instance.frameCount % cycleLength;
        const slideInEnd = 88;

        if (peekFaceState.cycleLength !== cycleLength) {
          peekFaceState.cycleLength = cycleLength;
        }

        if (cycleFrame === 0) {
          peekFaceState.side = pickPeekFaceSide();
          resetPeekFaceTimings(peekFaceState, slideInEnd, cycleLength, logoSettings.face);
          resetPeekFaceTarget(peekFaceState, logoSettings.face);
        }

        const openStart = peekFaceState.openStart;
        const winkStart = peekFaceState.winkStart;
        const winkEnd = peekFaceState.winkEnd;
        const slideOutStart = peekFaceState.slideOutStart;
        const shownX = peekFaceState.shownX;
        const shownY = peekFaceState.shownY;
        const hiddenPosition = getPeekFaceHiddenPosition(peekFaceState.side, shownX, shownY);
        const eyeState = getPeekFaceEyeState(cycleFrame, openStart, winkStart, winkEnd, peekFaceState);
        const mouthState = getPeekFaceMouthState(cycleFrame, openStart, slideOutStart, peekFaceState);
        const bounce = Math.sin((cycleFrame / cycleLength) * Math.PI * 2) * 0.35;
        let faceX = shownX;
        let faceY = shownY;

        if (cycleFrame < slideInEnd) {
          const progress = easeInOutCubic(cycleFrame / slideInEnd);
          faceX = instance.lerp(hiddenPosition.x, shownX, progress);
          faceY = instance.lerp(hiddenPosition.y, shownY, progress);
        } else if (cycleFrame >= slideOutStart) {
          const progress = easeInOutCubic((cycleFrame - slideOutStart) / (cycleLength - slideOutStart));
          faceX = instance.lerp(shownX, hiddenPosition.x, progress);
          faceY = instance.lerp(shownY, hiddenPosition.y, progress);
        }

        instance.noStroke();
        instance.fill(backgroundColor[0], backgroundColor[1], backgroundColor[2], 255);
        instance.rect(0, 0, width, height, 10);

        instance.push();
        instance.translate(faceX, faceY + bounce);

        instance.fill(faceColor[0], faceColor[1], faceColor[2], 255);
        instance.circle(0, 0, 26);

        if (peekFaceState.showHat) {
          drawPeekFaceHat(instance);
        }

        if (peekFaceState.talkMode && cycleFrame >= openStart && cycleFrame < slideOutStart) {
          drawPeekFaceSpeechBubble(instance);
        }

        drawPeekFaceMouth(instance, mouthState);
        drawPeekFaceEye(instance, -4.8, -3.3, eyeState.left);
        drawPeekFaceEye(instance, 4.8, -3.3, eyeState.right);
        instance.pop();
      }

      p.draw = function () {
        p.clear();

        if (animationMode === "peek-face") {
          drawPeekFace(p);
          return;
        }

        if (animationMode === "gg-dual-spin") {
          drawDualSpinningGG(p);
          return;
        }

        if (animationMode === "g-spin") {
          drawSpinningG(p);
          return;
        }

        drawBackground(p, animationMode !== "signal" || logoSettings.signal.gridEnabled);

        if (animationMode === "bars") {
          drawSineBars(p);
          return;
        }

        if (animationMode === "radar") {
          drawRadarSweep(p);
          return;
        }

        drawSignalTrace(p);
      };
    });

    return true;
  }

  function mountAllSketches() {
    if (prefersReducedMotion.matches || typeof window.p5 !== "function") {
      return false;
    }

    const hosts = Array.from(document.querySelectorAll("[data-logo-canvas]"));
    let mountedAny = false;

    hosts.forEach((host) => {
      mountedAny = mountSketch(host) || mountedAny;
    });

    return mountedAny;
  }

  function waitForP5() {
    if (mountAllSketches()) {
      return;
    }

    if (prefersReducedMotion.matches) {
      return;
    }

    window.requestAnimationFrame(waitForP5);
  }

  window.mountHeaderLogoSketches = mountAllSketches;
  waitForP5();
})();
