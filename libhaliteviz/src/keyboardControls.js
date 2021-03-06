export class KeyboardControls {
    constructor(visualizer, bindings) {
        this.visualizer = visualizer;
        this.keyState = {};
        this.keyBindings = bindings;

        this.el = null;
        this._onKeyUp = null;
        this._onKeyDown = null;
    }

    attach(el) {
        if (!el) el = document.body;
        this.el = el;

        // Make element focusable
        el.querySelector("canvas").setAttribute("tabindex", 0);

        this._onKeyUp = (e) => {
            if (document.activeElement.tagName == "INPUT") return;
            if (typeof this.keyBindings[e.code] !== "undefined") {
                const event = this.keyBindings[e.code];
                if (typeof event === "function") {
                    event();
                }
                else {
                    this.keyState[event] = false;
                    if (!this.visualizer.isPlaying() &&
                        Object.values(this.keyState).every((v) => !v)) {
                    }
                }
                e.preventDefault();
            }
        };

        this._onKeyDown = (e) => {
            if (document.activeElement.tagName == "INPUT") return;
            if (typeof this.keyBindings[e.code] !== "undefined") {
                const event = this.keyBindings[e.code];
                if (typeof event !== "function") {
                    this.keyState[event] = true;
                    if (!this.visualizer.isPlaying()) {
                        // Run the Pixi event loop while keys are down
                        this.visualizer.application.start();
                    }
                }
                e.preventDefault();
            }
        };

        el.addEventListener("keyup", this._onKeyUp);
        el.addEventListener("keydown", this._onKeyDown);
    }

    destroy() {
        this.el.removeEventListener("keyup", this._onKeyUp);
        this.el.removeEventListener("keydown", this._onKeyDown);
        this.visualizer = null;
    }

    handleKeys(dt) {
        dt *= this.visualizer.timeStep * this.visualizer.scrubSpeed * 50;

        if (this.keyState["scrubBackwards"]) {
            this.visualizer.pause();
            this.visualizer.advanceTime(-dt);
            this.visualizer.render();
        }
        else if (this.keyState["scrubForwards"]) {
            this.visualizer.pause();
            this.visualizer.advanceTime(dt);
            this.visualizer.render(dt);
        }

        if (this.keyState["panUp"]) {
            this.visualizer.camera.panBy(0, 1);
        }
        else if (this.keyState["panDown"]) {
            this.visualizer.camera.panBy(0, -1);
        }

        if (this.keyState["panLeft"]) {
            this.visualizer.camera.panBy(1, 0);
        }
        else if (this.keyState["panRight"]) {
            this.visualizer.camera.panBy(-1, 0);
        }

        if (this.keyState["zoomIn"]) {
            this.visualizer.camera.zoomBy(0.5, 0.5, dt);
        }
        else if (this.keyState["zoomOut"]) {
            this.visualizer.camera.zoomBy(0.5, 0.5, -dt);
        }
    }
}
