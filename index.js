const { default: SignJWT } = require('jose/jwt/sign');
const express = require('express');
const crypto = require('crypto');
const auth = require('./auth.json');
const fetch = require('node-fetch');
const { ADJECTIVES, NOUNS } = require('./words');

// This is your "App ID" as obtained from the High Fidelity Audio API Developer Console. Do not share this string.
const APP_ID = auth.HIFI_APP_ID;
// This is the "App Secret" as obtained from the High Fidelity Audio API Developer Console. Do not share this string.
const APP_SECRET = auth.HIFI_APP_SECRET;
const SECRET_KEY_FOR_SIGNING = crypto.createSecretKey(Buffer.from(APP_SECRET, "utf8"));

const app = express();
const PORT = 8123;

app.set('view engine', 'ejs');
app.use(express.static('static'))

function uppercaseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function generateHiFiJWT(userID, spaceID, isAdmin) {
    let hiFiJWT;
    try {
        let jwtArgs = {
            "user_id": userID,
            "app_id": APP_ID
        };

        if (spaceID) {
            jwtArgs["space_id"] = spaceID;
        }

        if (isAdmin) {
            jwtArgs["admin"] = true;
        }

        hiFiJWT = await new SignJWT(jwtArgs)
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .sign(SECRET_KEY_FOR_SIGNING);

        return hiFiJWT;
    } catch (error) {
        console.error(`Couldn't create JWT! Error:\n${error}`);
        return;
    }
}

async function createNewSpace(spaceName) {
    let createSpaceResponse;
    try {
        createSpaceResponse = await fetch(`https://api.highfidelity.com/api/v1/spaces/create?token=${adminJWT}&name=${spaceName}`);
    } catch (e) {
        return res.status(500).send();
    }

    let spaceJSON;
    try {
        spaceJSON = await createSpaceResponse.json();
    } catch (e) {
        return res.status(500).send();
    }

    spaceID = spaceJSON["space-id"];
    spaceNameToIDMap.set(spaceName, spaceID);
}

let spaceNameToIDMap = new Map();
let providedUserIDAtSpaceNameToConnectionTimestampMap = new Map();
app.get('/spatial-speaker-space/speaker', async (req, res) => {
    let spaceName = req.query.spaceName || auth.HIFI_DEFAULT_SPACE_NAME;

    let spaceID;
    if (spaceNameToIDMap.has(spaceName)) {
        spaceID = spaceNameToIDMap.get(spaceName);
    } else {
        await createNewSpace(spaceName);
    }
    console.log(`The HiFi Space ID associated with Space Name \`${spaceName}\` is \`${spaceID}\`.`);

    let providedUserID = "speaker-";
    providedUserID += req.query.username || `${uppercaseFirstLetter(ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)])}${uppercaseFirstLetter(NOUNS[Math.floor(Math.random() * NOUNS.length)])}`;
    providedUserID += Math.floor(Math.random() * Math.floor(1000));
    let hiFiJWT = await generateHiFiJWT(providedUserID, spaceID, false);
    let timestamp = Date.now();
    providedUserIDAtSpaceNameToConnectionTimestampMap.set(`${providedUserID}@${spaceName}`, timestamp);

    res.render('index', { timestamp: Date.now(), providedUserID, hiFiJWT, spaceName, isSpeaker: true });
});

app.get('/spatial-speaker-space/audience', async (req, res) => {
    let spaceName = req.query.spaceName || auth.HIFI_DEFAULT_SPACE_NAME;

    let spaceID;
    if (spaceNameToIDMap.has(spaceName)) {
        spaceID = spaceNameToIDMap.get(spaceName);
    } else {
        await createNewSpace(spaceName);
    }
    console.log(`The HiFi Space ID associated with Space Name \`${spaceName}\` is \`${spaceID}\`.`);
    
    let providedUserID = "audience-";
    providedUserID += req.query.username || `${uppercaseFirstLetter(ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)])}${uppercaseFirstLetter(NOUNS[Math.floor(Math.random() * NOUNS.length)])}`;
    providedUserID += Math.floor(Math.random() * Math.floor(1000));
    let hiFiJWT = await generateHiFiJWT(providedUserID, spaceID, false);

    let timestamp = Date.now();
    providedUserIDAtSpaceNameToConnectionTimestampMap.set(`${providedUserID}@${spaceName}`, timestamp);
    
    res.render('index', { connectionTimestamp: timestamp, providedUserID, hiFiJWT, spaceName, isSpeaker: false });
});

app.get('/spatial-speaker-space/get-connection-age', (req, res) => {
    let providedUserID = req.query.providedUserID;
    let spaceName = req.query.spaceName;

    res.json({
        "providedUserID": providedUserID,
        "spaceName": spaceName,
        "connectionTimestamp": providedUserIDAtSpaceNameToConnectionTimestampMap.get(`${providedUserID}@${spaceName}`)
    }).send();
});

let adminJWT;
app.listen(PORT, async () => {
    adminJWT = await generateHiFiJWT("example-admin", undefined, true);
    console.log(`Spatial Speaker Space is ready and listening at http://localhost:${PORT}\nSpeaker link: http://localhost:${PORT}/spatial-speaker-space/speaker\nAudience link: http://localhost:${PORT}/spatial-speaker-space/audience`)
});
