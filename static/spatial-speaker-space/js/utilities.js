function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function linearScale(factor, minInput, maxInput, minOutput, maxOutput) {
    factor = clamp(factor, minInput, maxInput);

    return minOutput + (maxOutput - minOutput) *
        (factor - minInput) / (maxInput - minInput);
}

function logarithmicScale(factor, minInput, maxInput, minOutput, maxOutput) {
    factor = clamp(factor, minInput, maxInput);

    minOutput = Math.log(minOutput);
    maxOutput = Math.log(maxOutput);

    let scale = (maxOutput - minOutput) / (maxInput - minInput);

    return Math.exp(minOutput + scale * (factor - minInput));
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function hexColorFromString(string) {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash); // eslint-disable-line
    }

    let color = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "#" + "000000".substring(0, 6 - color.length) + color;
}

function hexToRGB(hexColor) {
    hexColor = hexColor.slice(1);
    const hexBaseValue = 16;
    let splitHexValues = hexColor.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    let red = parseInt(splitHexValues[1], hexBaseValue);
    let green = parseInt(splitHexValues[2], hexBaseValue);
    let blue = parseInt(splitHexValues[3], hexBaseValue);

    return {
        red: red,
        green: green,
        blue: blue
    }
}

function getConstrastingTextColor(rgb) {
    // HSP Color Model equation from http://alienryderflex.com/hsp.html
    // The three constants (.299, .587, and .114) represent the different degrees to which each of the primary (RGB) colors 
    // affects human perception of the overall brightness of a color.  Notice that they sum to 1.
    let perceivedBrightnessDegreeRed = 0.299;
    let perceivedBrightnessDegreeGreen = 0.587;
    let perceivedBrightnessDegreeBlue = 0.114;

    let brightness = Math.sqrt(
        perceivedBrightnessDegreeRed * (rgb.red * rgb.red) +
        perceivedBrightnessDegreeGreen * (rgb.green * rgb.green) +
        perceivedBrightnessDegreeBlue * (rgb.blue * rgb.blue)
    );

    // Using the HSP value, determine whether the color is light or dark
    let medianBrightnessValue = 127.5;
    if (brightness > medianBrightnessValue) {
        return "#000000";
    }
    else {
        return "#FFFFFF";
    }
}

function getInitials(name) {
    if (!name) {
        return "";
    }

    name = name.toString();
    
    let textWords = name.split(" ");
    textWords = textWords.splice(0, 2);
    textWords.forEach((word, idx) => { const symbols = [...word]; textWords[idx] = symbols[0]; });
    return textWords.join("").toUpperCase();
}

function getYawOrientationDegreesFromQuat(hiFiQuat) {
    let threeEuler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(hiFiQuat.x, hiFiQuat.y, hiFiQuat.z, hiFiQuat.w), THREE_EULER_ORDER);
    let yawOrientationDegrees = threeEuler.z * 180 / Math.PI;
    while (yawOrientationDegrees < 0) {
        yawOrientationDegrees += 360;
    }
    yawOrientationDegrees = Math.round((yawOrientationDegrees + Number.EPSILON) * 100) / 100;
    return yawOrientationDegrees;
}
