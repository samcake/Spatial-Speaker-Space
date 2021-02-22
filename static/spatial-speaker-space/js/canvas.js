var mainCanvas = document.querySelector(".mainCanvas");
var ctx = mainCanvas.getContext("2d");
function updateCanvas() {
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    if (!allUserData) {
        return;
    }

    let myUserData = allUserData.find((element) => { return element.providedUserID === myProvidedUserID; });
    if (!myUserData || !myUserData.position || !VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M) {
        return;
    }

    const PIXELS_PER_METER = Math.round(Math.min(mainCanvas.width, mainCanvas.height) / VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M);

    if (DRAW_SCALE) {
        ctx.font = CIRCLE_LABEL_FONT;
        ctx.fillStyle = CIRCLE_LABEL_COLOR_HEX;
        ctx.lineWidth = SCALE_ARC_STROKE_WIDTH_PX;
        for (const circleInfo of SCALE_ARC_INFO) {
            ctx.strokeStyle = circleInfo.color;
            let circleRadiusM = circleInfo.radius;
            let circleRadiusPX = PIXELS_PER_METER * circleRadiusM;
            ctx.beginPath();
            ctx.arc(mainCanvas.width / 2, mainCanvas.height / 2, circleRadiusPX, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.textAlign = "center";
            ctx.fillText(`${circleRadiusM}m`, mainCanvas.width / 2, mainCanvas.height / 2 - circleRadiusPX - CIRCLE_LABEL_PADDING_PX);
            ctx.fillText(`${circleRadiusM}m`, mainCanvas.width / 2, mainCanvas.height / 2 + circleRadiusPX + CIRCLE_LABEL_PADDING_PX);
            ctx.textAlign = "end";
            ctx.fillText(`${circleRadiusM}m`, mainCanvas.width / 2 - circleRadiusPX - CIRCLE_LABEL_PADDING_PX, mainCanvas.height / 2);
            ctx.textAlign = "start";
            ctx.fillText(`${circleRadiusM}m`, mainCanvas.width / 2 + circleRadiusPX + CIRCLE_LABEL_PADDING_PX, mainCanvas.height / 2);
        }
    }

    for (const currentUserData of allUserData) {
        if (!currentUserData.position || !currentUserData.orientationEuler ||
            typeof (currentUserData.position.x) !== "number" || typeof (currentUserData.position.y) !== "number" || typeof (currentUserData.orientationEuler.yawDegrees) !== "number") {
            continue;
        }

        let positionInCanvasSpace = {
            "x": Math.round(linearScale(currentUserData.position.x, -VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, 0, mainCanvas.width)),
            // We "reverse" the last two terms here because "-y" in canvas space is "+y" in mixer space.
            "y": Math.round(linearScale(currentUserData.position.y, -VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, mainCanvas.height, 0))
        };

        let isMine = currentUserData.providedUserID === myProvidedUserID;
        
        let userHexColor = hexColorFromString(currentUserData.providedUserID);        
        ctx.lineWidth = AVATAR_STROKE_WIDTH_PX;
        ctx.fillStyle = userHexColor;
        ctx.translate(positionInCanvasSpace.x, positionInCanvasSpace.y);
        let amtToRotate = currentUserData.orientationEuler.yawDegrees * Math.PI / 180;
        ctx.rotate(amtToRotate);
        ctx.beginPath();
        ctx.arc(0, 0, USER_RADIUS_M * PIXELS_PER_METER, 0, 2 * Math.PI);
        if (isMine) {
            ctx.strokeStyle = MY_AVATAR_STROKE_HEX;
        } else {
            ctx.strokeStyle = OTHER_AVATAR_STROKE_HEX;
        }
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -(USER_RADIUS_M + ORIENTATION_CIRCLE_OFFSET_M) * PIXELS_PER_METER, USER_RADIUS_M / 4 * PIXELS_PER_METER, 0, 2 * Math.PI);
        ctx.fill();
        ctx.rotate(-amtToRotate);
        ctx.translate(-positionInCanvasSpace.x, -positionInCanvasSpace.y);
    }
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
