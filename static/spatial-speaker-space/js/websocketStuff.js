const socket = io();

function initWebSocketStuff() {
    socket.emit("addParticipant", myProvidedUserID, spaceName);
}

function stopWebSocketStuff() {
    socket.emit("removeParticipant", myProvidedUserID, spaceName);
}

