var mainCanvas = document.querySelector(".mainCanvas");
var ctx = mainCanvas.getContext("2d");

let pxPerM;
function updatePixelsPerMeter() {
    pxPerM = Math.round(Math.min(mainCanvas.width, mainCanvas.height) / VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M);
}

function maybeDrawScaleArcs() {
    if (DRAW_SCALE_ARCS) {
        ctx.font = SCALE_ARC_LABEL_FONT;
        ctx.fillStyle = SCALE_ARC_LABEL_COLOR_HEX;
        ctx.lineWidth = SCALE_ARC_STROKE_WIDTH_PX;
        for (const circleInfo of SCALE_ARC_INFO) {
            ctx.strokeStyle = circleInfo.color;
            let circleRadiusM = circleInfo.radius;
            if (circleRadiusM === 0) {
                continue;
            }
            let circleRadiusPX = pxPerM * circleRadiusM;
            ctx.beginPath();
            ctx.arc(mainCanvas.width / 2, mainCanvas.height / 2, circleRadiusPX, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.textAlign = "center";
            ctx.fillText(`${circleRadiusM}m`, mainCanvas.width / 2, mainCanvas.height / 2 - circleRadiusPX - SCALE_ARC_LABEL_PADDING_PX);
            ctx.fillText(`${circleRadiusM}m`, mainCanvas.width / 2, mainCanvas.height / 2 + circleRadiusPX + SCALE_ARC_LABEL_PADDING_PX);
            ctx.textAlign = "end";
            ctx.fillText(`${circleRadiusM}m`, mainCanvas.width / 2 - circleRadiusPX - SCALE_ARC_LABEL_PADDING_PX, mainCanvas.height / 2);
            ctx.textAlign = "start";
            ctx.fillText(`${circleRadiusM}m`, mainCanvas.width / 2 + circleRadiusPX + SCALE_ARC_LABEL_PADDING_PX, mainCanvas.height / 2);
            ctx.closePath();
        }
    }
}

function drawAvatarBase({ isMine, userData, userHexColor, positionInCanvasSpace }) {
    ctx.translate(positionInCanvasSpace.x, positionInCanvasSpace.y);
    let amtToRotate = userData.orientationEuler.yawDegrees * Math.PI / 180;
    ctx.rotate(amtToRotate);

    let avatarRadius;
    if (userData.isSpeaker) {
        avatarRadius = SPEAKER_AVATAR_RADIUS_M;
    } else {
        avatarRadius = AUDIENCE_AVATAR_RADIUS_M;
    }
    
    // Don't show orientation visualization if user is an audience member.
    if (userData.isSpeaker) {
        ctx.beginPath();
        ctx.arc(0, -avatarRadius * DIRECTION_CLOUD_RADIUS_MULTIPLIER * pxPerM, avatarRadius * DIRECTION_CLOUD_RADIUS_MULTIPLIER * pxPerM, 0, Math.PI, false);
        let grad = ctx.createLinearGradient(0, 0, 0, -avatarRadius * DIRECTION_CLOUD_RADIUS_MULTIPLIER * pxPerM);
        grad.addColorStop(0.0, userHexColor);
        grad.addColorStop(1.0, userHexColor + "00");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.closePath();
    }

    ctx.lineWidth = AVATAR_STROKE_WIDTH_PX;
    ctx.fillStyle = userHexColor;
    ctx.beginPath();
    ctx.arc(0, 0, avatarRadius * pxPerM, 0, 2 * Math.PI);
    if (isMine) {
        ctx.strokeStyle = MY_AVATAR_STROKE_HEX;
    } else {
        ctx.strokeStyle = OTHER_AVATAR_STROKE_HEX;
    }
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
    ctx.rotate(-amtToRotate);
    ctx.translate(-positionInCanvasSpace.x, -positionInCanvasSpace.y);
}

function drawAvatarLabel({ isMine, userData, userHexColor, positionInCanvasSpace }) {
    let text;
    if (isMine) {
        text = MY_AVATAR_LABEL;
    } else if (userData.providedUserID) {
        let modifiedUserID;
        if (userData.isSpeaker) {
            modifiedUserID = userData.providedUserID.replace("speaker-", "");
        } else {
            modifiedUserID = userData.providedUserID.replace("audience-", "");
        }
        text = getInitials(modifiedUserID);
    }

    if (!text) {
        return;
    }

    ctx.font = MY_AVATAR_LABEL_FONT;
    ctx.fillStyle = getConstrastingTextColor(hexToRGB(userHexColor));
    ctx.textAlign = "center";

    ctx.fillText(text, positionInCanvasSpace.x, positionInCanvasSpace.y + MY_AVATAR_LABEL_Y_OFFSET_PX);
}

function drawAvatar({ userData }) {
    if (!userData || !userData.position || !userData.orientationEuler ||
        typeof (userData.position.x) !== "number" || typeof (userData.position.y) !== "number" || typeof (userData.orientationEuler.yawDegrees) !== "number") {
        return;
    }

    let positionInCanvasSpace = {
        "x": Math.round(linearScale(userData.position.x, -VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, 0, mainCanvas.width)),
        // We "reverse" the last two terms here because "-y" in canvas space is "+y" in mixer space.
        "y": Math.round(linearScale(userData.position.y, -VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, mainCanvas.height, 0))
    };

    let isMine = userData.providedUserID === myProvidedUserID;

    let userHexColor = hexColorFromString(userData.providedUserID);
    drawAvatarBase({ isMine, userData, userHexColor, positionInCanvasSpace });
    drawAvatarLabel({ isMine, userData, userHexColor, positionInCanvasSpace });
}

function updateCanvas() {
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    if (!allUserData) {
        return;
    }

    let myUserData = allUserData.find((element) => { return element.providedUserID === myProvidedUserID; });
    let allOtherUserData = allUserData.filter((element) => { return element.providedUserID !== myProvidedUserID; });

    updatePixelsPerMeter();

    for (const userData of allOtherUserData) {
        drawAvatar({ userData });
    }

    drawAvatar({ userData: myUserData });
}

function updateCanvasDimensions() {
    let dimension = Math.min(window.innerWidth, window.innerHeight);

    mainCanvas.width = dimension;
    mainCanvas.height = dimension;

    mainCanvas.style.left = `${window.innerWidth / 2 - dimension / 2}px`;
    mainCanvas.style.width = `${dimension}px`;
    mainCanvas.style.height = `${dimension}px`;
}
updateCanvasDimensions();
