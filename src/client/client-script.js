const WS_PORT = 8081;
const userID = Math.random().toString(36).substring(2, 8);
const MAX_USERS = 5;
const slots = {}

// TODO: should be 0-indexed
for(let i = 1; i < MAX_USERS; i++){
    slots[i] = null;
}

document.getElementById('user-id-display').innerText = `User ID: ${userID}`;

const videoContainer = document.getElementById('video-container');


const ws = new WebSocket(`ws://localhost:${WS_PORT}`);

ws.onclose = () => console.log('WebSocket connection closed');

ws.onopen = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    await connectPeerConnection(peer, stream);
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received message:', message);

    const {method, params} = message;

    if(method == 'newUser'){
        const {userId} = params;
        console.log('New user connected', userId);

        const freeSlot = Object.keys(slots).find(key => slots[key] == null);
        console.log('Trying to subscribe to user', userId, 'in slot', freeSlot);
        subscribeToUser(userId, freeSlot);
    }
};


const peer = new RTCPeerConnection();

function sendAndWaitForResponse(message){
    return new Promise((res, rej) => {
        ws.send(JSON.stringify(message));

        const listener = (event) => {
            const data = JSON.parse(event.data);
            if(data.id === message.id){
                ws.removeEventListener('message', listener);
                res(data);
            }
        }
        ws.addEventListener('message', listener);

    })
}

async function connectPeerConnection(peer, stream){

    for(let i = 0; i < MAX_USERS; i++){
        if(i == 0){
            peer.addTransceiver(stream.getAudioTracks()[0], { direction: 'sendrecv' });
            peer.addTransceiver(stream.getVideoTracks()[0], { direction: 'sendrecv' });
        }
        else{
            peer.addTransceiver('audio', { direction: 'recvonly' });
            peer.addTransceiver('video', { direction: 'recvonly' });
        }
    }

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    await new Promise(res => {
        peer.onicegatheringstatechange = () => {
            if (peer.iceGatheringState === 'complete') {
                console.log('ICE gathering complete');
                res();
            }
        }
    })

    const message = {
        id: Math.floor(Math.random() * 1000),
        userId: userID,
        method: 'createUser',
        params: {
            sdp: peer.localDescription
        }
    }

    const response = await sendAndWaitForResponse(message);
    console.log('Received sdp response:', response);

    peer.setRemoteDescription(response.params.sdp);
}

async function subscribeToUser(userToSubscribe, slot){
    const message = await sendAndWaitForResponse({
        id: Math.random().toString(32).slice(2, 8),
        userId: userID,
        method: "subscribe",
        params: {
            userToSubscribe, slot
        }
    })

    if(message.method === 'subscribe' && message.params.success == true){
        console.log('Subscribed to user successfully:', userToSubscribe);
        const videoElement = document.createElement('video');
        
        const stream = new MediaStream();
        
        const audioTrack = peer.getTransceivers()[slot * 2].receiver.track;
        const videoTrack = peer.getTransceivers()[slot * 2 + 1].receiver.track;

        console.log('audioTrack', audioTrack, 'videoTrack', videoTrack);

        stream.addTrack(audioTrack);
        stream.addTrack(videoTrack);

        videoElement.srcObject = stream;
        videoContainer.appendChild(videoElement);

        videoElement.play();
    }
}