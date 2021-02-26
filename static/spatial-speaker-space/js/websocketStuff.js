const socket = io();

function initWebSocketStuff() {
    socket.emit("addParticipant", myProvidedUserID, spaceName);
}

function stopWebSocketStuff() {
    socket.emit("removeParticipant", myProvidedUserID, spaceName);
}

socket.on("requestParticleAdd", (providedUserID, spaceName, particleData) => {
    let particleParams = JSON.parse(particleData);

    if (particleParams.signalName) {
        console.log(`"${providedUserID}" added a signal particle!`);
        signalsController.addSignal(particleParams);
    }
});
