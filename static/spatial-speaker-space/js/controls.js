const M_KEY_CODE = "KeyM";
const SPACE_KEY_CODE = "Space";
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
