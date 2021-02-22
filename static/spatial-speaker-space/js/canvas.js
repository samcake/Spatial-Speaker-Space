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

function drawAvatarBase({ isMine, userData, avatarRadiusM, positionInCanvasSpace }) {
    if (typeof (userData.yawOrientationDegrees) !== "number") {
        return;
    }

    ctx.translate(positionInCanvasSpace.x, positionInCanvasSpace.y);
    let amtToRotate = userData.yawOrientationDegrees * Math.PI / 180;
    ctx.rotate(amtToRotate);
    
    // Don't show orientation visualization if user is an audience member.
    if (userData.isSpeaker) {
        ctx.beginPath();
        ctx.arc(0, -avatarRadiusM * DIRECTION_CLOUD_RADIUS_MULTIPLIER * pxPerM, avatarRadiusM * DIRECTION_CLOUD_RADIUS_MULTIPLIER * pxPerM, 0, Math.PI, false);
        let grad = ctx.createLinearGradient(0, 0, 0, -avatarRadiusM * DIRECTION_CLOUD_RADIUS_MULTIPLIER * pxPerM);
        grad.addColorStop(0.0, userData.hexColor);
        grad.addColorStop(1.0, userData.hexColor + "00");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.closePath();
    }

    ctx.lineWidth = AVATAR_STROKE_WIDTH_PX;
    ctx.fillStyle = userData.hexColor;
    ctx.beginPath();
    ctx.arc(0, 0, avatarRadiusM * pxPerM, 0, 2 * Math.PI);
    if (isMine) {
        if (isMuted) {
            ctx.strokeStyle = MY_AVATAR_STROKE_HEX_MUTED;
        } else {
            ctx.strokeStyle = MY_AVATAR_STROKE_HEX_UNMUTED;
        }
    } else {
        ctx.strokeStyle = OTHER_AVATAR_STROKE_HEX;
    }
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
    ctx.rotate(-amtToRotate);
    ctx.translate(-positionInCanvasSpace.x, -positionInCanvasSpace.y);
}

function drawAvatarLabel({ isMine, userData, positionInCanvasSpace }) {
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
    ctx.fillStyle = getConstrastingTextColor(hexToRGB(userData.hexColor));
    ctx.textAlign = "center";

    ctx.fillText(text, positionInCanvasSpace.x, positionInCanvasSpace.y + MY_AVATAR_LABEL_Y_OFFSET_PX);
}

function drawVolumeBubble({ userData, avatarRadiusM, positionInCanvasSpace }) {
    ctx.beginPath();
    ctx.arc(positionInCanvasSpace.x, positionInCanvasSpace.y, linearScale(userData.volumeDecibels, MIN_VOLUME_DB, MAX_VOLUME_DB, avatarRadiusM, avatarRadiusM * MAX_VOLUME_DB_AVATAR_RADIUS_MULTIPLIER) * pxPerM, 0, 2 * Math.PI);
    ctx.fillStyle = userData.hexColor;
    ctx.fill();
    ctx.closePath();
}

function drawAvatar({ userData }) {
    if (!userData || !userData.position || typeof (userData.position.x) !== "number" || typeof (userData.position.y) !== "number" || typeof (userData.yawOrientationDegrees) !== "number") {
        return;
    }

    let positionInCanvasSpace = {
        "x": Math.round(linearScale(userData.position.x, -VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, 0, mainCanvas.width)),
        // We "reverse" the last two terms here because "-y" in canvas space is "+y" in mixer space.
        "y": Math.round(linearScale(userData.position.y, -VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, mainCanvas.height, 0))
    };

    let isMine = userData.providedUserID === myProvidedUserID;

    let avatarRadiusM;
    if (userData.isSpeaker) {
        avatarRadiusM = SPEAKER_AVATAR_RADIUS_M;
    } else {
        avatarRadiusM = AUDIENCE_AVATAR_RADIUS_M;
    }

    drawVolumeBubble({ userData, avatarRadiusM, positionInCanvasSpace });
    drawAvatarBase({ isMine, userData, avatarRadiusM, positionInCanvasSpace });
    drawAvatarLabel({ isMine, userData, positionInCanvasSpace });
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
