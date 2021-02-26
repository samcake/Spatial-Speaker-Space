const M_KEY_CODE = "KeyM";
const SPACE_KEY_CODE = "Space";
const ONE_KEY_CODE = "Digit1";
const TWO_KEY_CODE = "Digit2";
let keyboardEventCache = [];
let wasMutedBeforePTT = false;

function onUserKeyDown(event) {
    let shouldAddKeyEvent = true;
    for (let i = 0; i < keyboardEventCache.length; i++) {
        if (keyboardEventCache[i].code === event.code) {
            shouldAddKeyEvent = false;
            break;
        }
    }
    if (shouldAddKeyEvent) {
        keyboardEventCache.unshift(event);
    }

    switch (keyboardEventCache[0].code) {
        case M_KEY_CODE:
            break;
        case SPACE_KEY_CODE:
            if (isMuted) {
                wasMutedBeforePTT = true;
                setInputMute(false);
            }
            break;
        case ONE_KEY_CODE:
            signalsController.toggleActiveSignal(signalsController.SUPPORTED_SIGNALS.POSITIVE.name);          
            break;
        case TWO_KEY_CODE:
            signalsController.toggleActiveSignal(signalsController.SUPPORTED_SIGNALS.NEGATIVE.name);
            break;
    }
}
document.addEventListener('keydown', onUserKeyDown, false);

function onUserKeyUp(event) {
    for (let i = keyboardEventCache.length - 1; i >= 0; i--) {
        if (keyboardEventCache[i].code === event.code) {
            keyboardEventCache.splice(i, 1);
        }
    }

    switch (event.code) {
        case M_KEY_CODE:
            toggleInputMute();
            break;
        case SPACE_KEY_CODE:
            if (wasMutedBeforePTT) {
                setInputMute(true);
                wasMutedBeforePTT = false;
            }
            break;
    }

    if (keyboardEventCache.length > 0) {
        onUserKeyDown(keyboardEventCache[0]);
    }
}
document.addEventListener('keyup', onUserKeyUp, false);

function onUserClick(e) {
    if (!myUserData || !canvasRotationDegrees) {
        return;
    }

    if (e.offsetY < 60) {
        // Didn't click on canvas.
        return;
    }

    let rotatedPoint = rotateAroundPoint(mainCanvas.width / 2, mainCanvas.height / 2, e.offsetX, e.offsetY - 60, canvasRotationDegrees);

    let clickM = {
        "x": linearScale(rotatedPoint[0], 0, mainCanvas.width, -VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2),
        "z": linearScale(rotatedPoint[1], 0, mainCanvas.height, -VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2)
    };

    let isCloseEnough = false;
    if (myUserData && myUserData.position) {
        isCloseEnough = getDistanceBetween2DPoints(myUserData.position.x, myUserData.position.z, clickM.x, clickM.z) < PARTICLES.CLOSE_ENOUGH_ADD_M;
    }

    if (signalsController && signalsController.activeSignalName && isCloseEnough) {
        signalsController.addActiveSignal(clickM);
        return;
    }
}
document.addEventListener('click', onUserClick);

/**
 * Gets the (x, y) point associated with an touch event, mouse event, or pointer event.
 * From: https://developers.google.com/web/fundamentals/design-and-ux/input/touch#implement-custom-gestures
 * @param {Event} evt 
 */
function getGesturePointFromEvent(evt) {
    let point = {};

    if (evt.targetTouches) {
        // Prefer Touch Events
        point.x = evt.targetTouches[0].clientX;
        point.y = evt.targetTouches[0].clientY;
    } else {
        // Either Mouse event or Pointer Event
        point.x = evt.clientX;
        point.y = evt.clientY;
    }

    return point;
}

let rightClickStartPositionPX;
function handleGestureOnCanvasStart(event) {
    event.preventDefault();

    if (window.PointerEvent) {
        event.target.setPointerCapture(event.pointerId);
    } else {
        document.addEventListener('mousemove', handleGestureOnCanvasMove, true);
        document.addEventListener('mouseup', handleGestureOnCanvasEnd, true);
    }

    let gesturePointPX = getGesturePointFromEvent(event);

    if (event.button === 2) {
        rightClickStartPositionPX = gesturePointPX;
    }
}

let lastDistanceBetweenRightClickEvents = 0;
const RIGHT_CLICK_ROTATION_SENSITIVITY = 0.5;
function handleGestureOnCanvasMove(event) {
    event.preventDefault();

    let gesturePointPX = getGesturePointFromEvent(event);
    
    if (event.buttons === 2 && rightClickStartPositionPX) {
        let newDistance = gesturePointPX.x - rightClickStartPositionPX.x;
        let deltaDistance = newDistance - lastDistanceBetweenRightClickEvents;
        lastDistanceBetweenRightClickEvents = newDistance;

        if (myUserData) {
            let newYawOrientationDegrees = myUserData.yawOrientationDegrees + deltaDistance * RIGHT_CLICK_ROTATION_SENSITIVITY;
            updateMyPositionAndOrientation(undefined, newYawOrientationDegrees);
        }
    }
}

function handleGestureOnCanvasEnd(event) {
    event.preventDefault();

    // Remove Event Listeners
    if (window.PointerEvent) {
        if (event.pointerId) {
            event.target.releasePointerCapture(event.pointerId);
        }
    } else {
        // Remove Mouse Listeners
        document.removeEventListener('mousemove', handleGestureOnCanvasMove, true);
        document.removeEventListener('mouseup', handleGestureOnCanvasEnd, true);
    }
    
    if (event.button === 2 && rightClickStartPositionPX) {
        rightClickStartPositionPX = null;
        lastDistanceBetweenRightClickEvents = 0;
    }
}

function handleGestureOnCanvasCancel(event) {
    handleGestureOnCanvasEnd(event);
}
if (window.PointerEvent) {
    document.addEventListener('pointerdown', handleGestureOnCanvasStart, true);
    document.addEventListener('pointermove', handleGestureOnCanvasMove, true);
    document.addEventListener('pointerup', handleGestureOnCanvasEnd, true);
    document.addEventListener("pointerout", handleGestureOnCanvasCancel, true);
} else {
    document.addEventListener('touchstart', handleGestureOnCanvasStart, true);
    document.addEventListener('touchmove', handleGestureOnCanvasMove, true);
    document.addEventListener('touchend', handleGestureOnCanvasEnd, true);
    document.addEventListener("touchcancel", handleGestureOnCanvasCancel, true);

    document.addEventListener("mousedown", handleGestureOnCanvasStart, true);
}
document.addEventListener("gesturestart", (e) => { e.preventDefault(); }, false);
document.addEventListener("gesturechange", (e) => { e.preventDefault(); }, false);
document.addEventListener("gestureend", (e) => { e.preventDefault(); }, false);
document.addEventListener("contextmenu", (e) => { e.preventDefault(); }, false);
