export class InputHandler {
  constructor() {
    this.keys = {};
    this.onPause = () => {};
    this.onSabotage = () => {};
    this.onDumpState = () => {};
    
    // Touch state
    this.touchElements = null;
    this.activeTouch = null; // Track active touch on joystick

    window.addEventListener("keydown", (e) => this.handleKeyDown(e));
    window.addEventListener("keyup", (e) => this.handleKeyUp(e));
    window.addEventListener("blur", () => this.handleBlur());
  }

  handleKeyDown(e) {
    this.keys[e.code] = true;
    // Prevent scrolling for game keys
    if (["ArrowUp", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();

    // Toggle Pause
    if (e.code === "KeyP" || e.code === "Escape") {
      e.preventDefault();
      this.onPause();
    }

    // Trigger Sabotage
    if (e.code === "KeyS") {
      e.preventDefault();
      this.onSabotage();
    }

    // Dump State (Debug) - F9 to avoid conflict with D=move right
    if (e.code === "F9") {
      e.preventDefault();
      this.onDumpState();
    }
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  handleBlur() {
    this.keys = {};
  }

  // Initialize touch controls with DOM elements
  initTouchControls(elements) {
    this.touchElements = elements;

    // Jump button
    if (elements.jumpBtn) {
      elements.jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.keys.ArrowUp = true;
        this.keys.Space = true;
        elements.jumpBtn.classList.add('active');
      });

      elements.jumpBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.keys.ArrowUp = false;
        this.keys.Space = false;
        elements.jumpBtn.classList.remove('active');
      });
    }

    // Sabotage button
    if (elements.sabotageBtn) {
      elements.sabotageBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.onSabotage();
        elements.sabotageBtn.classList.add('active');
      });

      elements.sabotageBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        elements.sabotageBtn.classList.remove('active');
      });
    }

    // Pause button
    if (elements.pauseBtn) {
      elements.pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.onPause();
      });
    }

    // Joystick (Right Touch Zone)
    if (elements.joystick) {
      elements.joystick.addEventListener("touchstart", (e) => {
        e.preventDefault();
        // Only track touches that start within the joystick zone
        const rect = elements.joystick.getBoundingClientRect();
        for (let touch of e.changedTouches) {
          const x = touch.clientX;
          const y = touch.clientY;
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            // This touch started in the joystick zone
            if (this.activeTouch === null) {
              this.activeTouch = touch.identifier;
              this.updateJoystick(touch, elements.joystick);
              break;
            }
          }
        }
      });

      elements.joystick.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (this.activeTouch === null) return;

        const rect = elements.joystick.getBoundingClientRect();
        for (let touch of e.touches) {
          if (touch.identifier === this.activeTouch) {
            // Check if touch has moved too far outside the joystick zone
            const x = touch.clientX;
            const y = touch.clientY;
            const margin = 50; // Allow some margin outside the zone

            if (
              x < rect.left - margin ||
              x > rect.right + margin ||
              y < rect.top - margin ||
              y > rect.bottom + margin
            ) {
              // Touch has moved too far outside - stop tracking
              this.activeTouch = null;
              this.keys.ArrowLeft = false;
              this.keys.ArrowRight = false;
              elements.joystick.classList.remove("active-left", "active-right");
              if (elements.indicator) {
                elements.indicator.style.display = "none";
              }
              return;
            }

            this.updateJoystick(touch, elements.joystick);
            break;
          }
        }
      });

      elements.joystick.addEventListener('touchend', (e) => {
        e.preventDefault();
        // Check if our tracked touch ended by looking at changedTouches
        let touchEnded = false;
        for (let touch of e.changedTouches) {
          if (touch.identifier === this.activeTouch) {
            touchEnded = true;
            break;
          }
        }
        
        if (touchEnded) {
          this.activeTouch = null;
          this.keys.ArrowLeft = false;
          this.keys.ArrowRight = false;
          elements.joystick.classList.remove('active-left', 'active-right');
          if (elements.indicator) {
            elements.indicator.style.display = 'none';
          }
        }
      });

      elements.joystick.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        this.activeTouch = null;
        this.keys.ArrowLeft = false;
        this.keys.ArrowRight = false;
        elements.joystick.classList.remove('active-left', 'active-right');
        if (elements.indicator) {
          elements.indicator.style.display = 'none';
        }
      });
    }
  }

  // Update joystick state based on touch position
  updateJoystick(touch, joystickElement) {
    const rect = joystickElement.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    const width = rect.width;
    
    // Split into thirds (discrete zones)
    const third = width / 3;
    
    // Update indicator position
    if (this.touchElements.indicator) {
      this.touchElements.indicator.style.display = 'block';
      this.touchElements.indicator.style.left = `${relativeX}px`;
    }
    
    // Determine which zone we're in
    if (relativeX < third) {
      // Left zone
      this.keys.ArrowLeft = true;
      this.keys.ArrowRight = false;
      joystickElement.classList.add('active-left');
      joystickElement.classList.remove('active-right');
    } else if (relativeX > 2 * third) {
      // Right zone
      this.keys.ArrowLeft = false;
      this.keys.ArrowRight = true;
      joystickElement.classList.add('active-right');
      joystickElement.classList.remove('active-left');
    } else {
      // Center zone (neutral)
      this.keys.ArrowLeft = false;
      this.keys.ArrowRight = false;
      joystickElement.classList.remove('active-left', 'active-right');
    }
  }
}
