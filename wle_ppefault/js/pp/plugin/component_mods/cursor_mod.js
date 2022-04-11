_WL._componentTypes[_WL._componentTypeIndices["cursor"]].proto.init = function () {
    /* VR session cache, in case in VR */
    this.session = null;
    this.collisionMask = (1 << this.collisionGroup);
    this.maxDistance = 100;

    this.doubleClickTimer = 0;
    this.tripleClickTimer = 0;
    this.multipleClickObject = null;
    this.multipleClickDelay = 0.3;

    this.visible = false;
};

_WL._componentTypes[_WL._componentTypeIndices["cursor"]].proto.update = function (dt) {
    if (this.doubleClickTimer > 0) {
        this.doubleClickTimer -= dt;
    }

    if (this.tripleClickTimer > 0) {
        this.tripleClickTimer -= dt;
    }

    this.doUpdate(false);
};

_WL._componentTypes[_WL._componentTypeIndices["cursor"]].proto.onSelect = function (e) {
};

_WL._componentTypes[_WL._componentTypeIndices["cursor"]].proto.onSelectStart = function (e) {
    if (this.active) {
        this.arTouchDown = true;
        if (e.inputSource.handedness == this.handedness) {
            this.isDown = true;
        }
    }
};

_WL._componentTypes[_WL._componentTypeIndices["cursor"]].proto.onSelectEnd = function (e) {
    if (this.active) {
        this.arTouchDown = false;
        if (e.inputSource.handedness == this.handedness) {
            this.isDown = false;
        }
    }
};

_WL._componentTypes[_WL._componentTypeIndices["cursor"]].proto.hoverBehaviour = function (rayHit, doClick) {
    if (rayHit.hitCount > 0) {
        if (!this.hoveringObject || !this.hoveringObject.equals(rayHit.objects[0])) {
            /* Unhover previous, if exists */
            if (this.hoveringObject) {
                let cursorTarget = this.hoveringObject.getComponent("cursor-target");
                if (cursorTarget) cursorTarget.onUnhover(this.hoveringObject, this);
                this.globalTarget.onUnhover(this.hoveringObject, this);

                this.isDown = false;
                this.lastIsDown = false;
            }

            /* Hover new object */
            this.hoveringObject = rayHit.objects[0];
            if (this.styleCursor) WL.canvas.style.cursor = "pointer";

            let cursorTarget = this.hoveringObject.getComponent("cursor-target");
            if (cursorTarget) {
                this.hoveringObjectTarget = cursorTarget;
                cursorTarget.onHover(this.hoveringObject, this);
            }
            this.globalTarget.onHover(this.hoveringObject, this);
        }

        if (this.hoveringObjectTarget) {
            this.hoveringObjectTarget.onMove(this.hoveringObject, this);
        }

        let cursorTarget = this.hoveringObject.getComponent("cursor-target");

        /* Cursor down */
        if (this.isDown !== this.lastIsDown) {
            if (this.isDown) {
                if (cursorTarget) cursorTarget.onDown(this.hoveringObject, this);
                this.globalTarget.onDown(this.hoveringObject, this);
            }
        }

        /* Click */
        if (this.isDown !== this.lastIsDown && !this.isDown) {
            if (this.tripleClickTimer > 0 && this.multipleClickObject && this.multipleClickObject.equals(this.hoveringObject)) {
                if (cursorTarget) cursorTarget.onTripleClick(this.hoveringObject, this);
                this.globalTarget.onTripleClick(this.hoveringObject, this);

                this.tripleClickTimer = 0;
            } else if (this.doubleClickTimer > 0 && this.multipleClickObject && this.multipleClickObject.equals(this.hoveringObject)) {
                if (cursorTarget) cursorTarget.onDoubleClick(this.hoveringObject, this);
                this.globalTarget.onDoubleClick(this.hoveringObject, this);

                this.tripleClickTimer = this.multipleClickDelay;
                this.doubleClickTimer = 0;
            } else {
                if (cursorTarget) cursorTarget.onClick(this.hoveringObject, this);
                this.globalTarget.onClick(this.hoveringObject, this);

                this.tripleClickTimer = 0;
                this.doubleClickTimer = this.multipleClickDelay;
                this.multipleClickObject = this.hoveringObject;
            }

            if (cursorTarget) cursorTarget.onUp(this.hoveringObject, this);
            this.globalTarget.onUp(this.hoveringObject, this);
        }
    } else if (this.hoveringObject && rayHit.hitCount == 0) {
        let cursorTarget = this.hoveringObject.getComponent("cursor-target");
        if (cursorTarget) cursorTarget.onUnhover(this.hoveringObject, this);
        this.globalTarget.onUnhover(this.hoveringObject, this);

        this.hoveringObject = null;
        this.hoveringObjectTarget = null;
        if (this.styleCursor) WL.canvas.style.cursor = "default";
    }

    if (this.hoveringObject) {
        this.lastIsDown = this.isDown;
    } else {
        this.isDown = false;
        this.lastIsDown = false;
    }
};

_WL._componentTypes[_WL._componentTypeIndices["cursor"]].proto.onDeactivate = function () {
    if (this.hoveringObject) {
        const cursorTarget = this.hoveringObject.getComponent('cursor-target');
        if (cursorTarget) cursorTarget.onUnhover(this.hoveringObject, this);
        this.globalTarget.onUnhover(this.hoveringObject, this);

        this.isDown = false;
        this.lastIsDown = false;

        this.hoveringObject = null;
        this.hoveringObjectTarget = null;
        if (this.styleCursor) WL.canvas.style.cursor = "default";
    }

    this._setCursorVisibility(false);
    if (this.cursorRayObject) {
        this.cursorRayObject.pp_setActive(false);
    }
};


_WL._componentTypes[_WL._componentTypeIndices["cursor"]].proto.onActivate = function () {
    this.showRay = true;
};

_WL._componentTypes[_WL._componentTypeIndices["cursor"]].proto._setCursorVisibility = function (visible) {
    if (this.visible == visible) return;
    this.visible = visible;
    if (!this.cursorObject) return;

    if (visible) {
        this.cursorObject.pp_setActive(true);
    } else {
        this.cursorObject.pp_setActive(false);
    }
};

_WL._componentTypes[_WL._componentTypeIndices["cursor"]].proto.start = function () {
    if (this.handedness == 0) {
        const inputComp = this.object.getComponent('input');
        if (!inputComp) {
            console.warn('cursor component on object', this.object.name,
                'was configured with handedness "input component", ' +
                'but object has no input component.');
        } else {
            this.handedness = inputComp.handedness;
            this.input = inputComp;
        }
    } else {
        this.handedness = ['left', 'right'][this.handedness - 1];
    }

    this.globalTarget = this.object.addComponent('cursor-target');

    this.origin = new Float32Array(3);
    this.cursorObjScale = new Float32Array(3);
    this.direction = [0, 0, 0];
    this.tempQuat = new Float32Array(4);
    this.viewComponent = this.object.getComponent("view");
    /* If this object also has a view component, we will enable inverse-projected mouse clicks,
     * otherwise just use the objects transformation */
    if (this.viewComponent != null) {
        WL.canvas.addEventListener("click", this.onClick.bind(this));
        WL.canvas.addEventListener("pointermove", this.onPointerMove.bind(this));
        WL.canvas.addEventListener("pointerdown", this.onPointerDown.bind(this));
        WL.canvas.addEventListener("pointerup", this.onPointerUp.bind(this));

        this.projectionMatrix = new Float32Array(16);
        mat4.invert(this.projectionMatrix, this.viewComponent.projectionMatrix);
        window.addEventListener("resize", this.onViewportResize.bind(this));
    }
    this.isHovering = false;
    this.visible = true;
    this.isDown = false;
    this.lastIsDown = false;

    this.cursorPos = new Float32Array(3);
    this.hoveringObject = null;

    WL.onXRSessionStart.push(this.setupVREvents.bind(this));

    this.showRay = true;
    if (this.cursorRayObject) {
        this.cursorRayObject.pp_setActive(true);
        this.showRay = false;
        this.cursorRayScale = new Float32Array(3);
        this.cursorRayScale.set(this.cursorRayObject.scalingLocal);

        /* Set ray to a good default distance of the cursor of 1m */
        this.object.getTranslationWorld(this.origin);
        this.object.getForward(this.direction);
        this._setCursorRayTransform([
            this.origin[0] + this.direction[0],
            this.origin[1] + this.direction[1],
            this.origin[2] + this.direction[2]]);
    }

    this._setCursorVisibility(false);
};


_WL._componentTypes[_WL._componentTypeIndices["cursor"]].proto.doUpdate = function (doClick) {
    /* If in VR, set the cursor ray based on object transform */
    if (this.session) {
        /* Since Google Cardboard tap is registered as arTouchDown without a gamepad, we need to check for gamepad presence */
        if (this.arTouchDown && this.input && WL.xrSession.inputSources[0].handedness === 'none' && WL.xrSession.inputSources[0].gamepad) {
            const p = WL.xrSession.inputSources[0].gamepad.axes;
            /* Screenspace Y is inverted */
            this.direction = [p[0], -p[1], -1.0];
            this.updateDirection();
        } else {
            this.object.getTranslationWorld(this.origin);
            this.object.getForward(this.direction);
        }
        const rayHit = this.rayHit = (this.rayCastMode == 0) ?
            WL.scene.rayCast(this.origin, this.direction, this.collisionMask) :
            WL.physics.rayCast(this.origin, this.direction, this.collisionMask, this.maxDistance);

        if (rayHit.hitCount > 0) {
            this.cursorPos.set(rayHit.locations[0]);
        } else {
            this.cursorPos.fill(0);
        }

        this.hoverBehaviour(rayHit, doClick);
    }

    if (this.cursorObject) {
        if (this.hoveringObject && (this.cursorPos[0] != 0 || this.cursorPos[1] != 0 || this.cursorPos[2] != 0)) {
            this._setCursorVisibility(true);
            this.cursorObject.setTranslationWorld(this.cursorPos);
            this._setCursorRayTransform(this.cursorPos);
        } else {
            if (this.visible && this.cursorRayObject) {
                this.object.getTranslationWorld(this.origin);
                this.object.getForward(this.direction);
                this._setCursorRayTransform([
                    this.origin[0] + this.direction[0],
                    this.origin[1] + this.direction[1],
                    this.origin[2] + this.direction[2]]);
            }

            this._setCursorVisibility(false);
        }

        if (this.cursorRayObject) {
            if (this.showRay) {
                this.cursorRayObject.pp_setActive(true);
                this.showRay = false;
            }
        }
    }
};