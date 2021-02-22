var mainCanvas = document.querySelector(".mainCanvas");
var ctx = mainCanvas.getContext("2d");

const CIRCLE_INFO = [
    {
        radius: 1.0,
        color: "#DFC2F2",
    },
    {
        radius: 2.5,
        color: "#CFB3CD",
    },
    {
        radius: 5.0,
        color: "#888098",
    },
    {
        radius: 10.0,
        color: "#344055",
    },
];
const CIRCLE_LABEL_PADDING_PX = 26;
const CIRCLE_LABEL_COLOR_HEX = "#BBBBBB";
const CIRCLE_LABEL_FONT = '18px sans-serif';

const DRAW_SCALE = false;
function updateCanvas() {
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    maybeDrawDebugCircles();

    if (!allUserData) {
        return;
    }

    let myUserData = allUserData.find((element) => { return element.providedUserID === myProvidedUserID; });
    if (!myUserData || !myUserData.position || !VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M) {
        return;
    }

    const PIXELS_PER_METER = Math.round(Math.min(mainCanvas.width, mainCanvas.height) / VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M);

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
        if (isMine && DRAW_SCALE) {
            ctx.font = CIRCLE_LABEL_FONT;
            ctx.fillStyle = CIRCLE_LABEL_COLOR_HEX;
            for (const circleInfo of CIRCLE_INFO) {
                ctx.strokeStyle = circleInfo.color;
                let circleRadiusM = circleInfo.radius;
                let circleRadiusPX = PIXELS_PER_METER * circleRadiusM;
                ctx.beginPath();
                ctx.arc(positionInCanvasSpace.x, positionInCanvasSpace.y, circleRadiusPX, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.textAlign = "center";
                ctx.fillText(`${circleRadiusM}m`, positionInCanvasSpace.x, positionInCanvasSpace.y - circleRadiusPX + CIRCLE_LABEL_PADDING_PX);
                ctx.fillText(`${circleRadiusM}m`, positionInCanvasSpace.x, positionInCanvasSpace.y + circleRadiusPX - CIRCLE_LABEL_PADDING_PX);
                ctx.textAlign = "start";
                ctx.fillText(`${circleRadiusM}m`, positionInCanvasSpace.x - circleRadiusPX + CIRCLE_LABEL_PADDING_PX, positionInCanvasSpace.y);
                ctx.textAlign = "end";
                ctx.fillText(`${circleRadiusM}m`, positionInCanvasSpace.x + circleRadiusPX - CIRCLE_LABEL_PADDING_PX, positionInCanvasSpace.y);
            }
        }
        
        let userHexColor = hexColorFromString(currentUserData.providedUserID);        
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.0;
        ctx.fillStyle = userHexColor;
        ctx.translate(positionInCanvasSpace.x, positionInCanvasSpace.y);
        let amtToRotate = currentUserData.orientationEuler.yawDegrees * Math.PI / 180;
        ctx.rotate(amtToRotate);
        ctx.beginPath();
        ctx.arc(0, 0, USER_RADIUS_M * PIXELS_PER_METER, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
        if (!currentUserData.isSpeaker) {
            ctx.beginPath();
            ctx.arc(0, -(USER_RADIUS_M + 0.1) * PIXELS_PER_METER, USER_RADIUS_M / 4 * PIXELS_PER_METER, 0, 2 * Math.PI);
        }
        ctx.fill();
        ctx.rotate(-amtToRotate);
        ctx.translate(-positionInCanvasSpace.x, -positionInCanvasSpace.y);
    }
}

const DRAW_DEBUG_CIRCLES = false;
function maybeDrawDebugCircles() {
    if (!DRAW_DEBUG_CIRCLES) {
        return;
    }

    const PIXELS_PER_METER = Math.round(Math.min(mainCanvas.width, mainCanvas.height) / VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M);
    ctx.fillStyle = "#00FF00";

    let positionInCanvasSpace = {
        "x": Math.round(linearScale(0, -VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, 0, mainCanvas.width)),
        // We "reverse" the last two terms here because "-y" in canvas space is "+y" in mixer space.
        "y": Math.round(linearScale(0, -VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, VIRTUAL_SPACE_DIMENSIONS_PER_SIDE_M / 2, mainCanvas.height, 0))
    };
    
    ctx.translate(positionInCanvasSpace.x, positionInCanvasSpace.y);
    let amtToRotate = 90 * Math.PI / 180;
    ctx.rotate(amtToRotate);
    ctx.beginPath();
    ctx.arc(0, 0, USER_RADIUS_M * PIXELS_PER_METER, 0, 2 * Math.PI);
    ctx.arc(0, -(USER_RADIUS_M + 0.1) * PIXELS_PER_METER, USER_RADIUS_M / 4 * PIXELS_PER_METER, 0, 2 * Math.PI);
    ctx.fill();
    ctx.rotate(-amtToRotate);
    ctx.translate(-positionInCanvasSpace.x, -positionInCanvasSpace.y);
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
