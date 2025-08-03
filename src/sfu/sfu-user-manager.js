
const MAX_USERS = 5;

const wsManager = new WSManager();
wsManager.addEventListener('message', (event) => handleMessageFromUser(event.detail));

const users = {};
window.users = users;

async function handleMessageFromUser(data){
    const userId = data.userId;
    const method = data.method;
    const params = data.params;
    const id = data.id;

    const reply = (params) => {
        const response = {
            id: id,
            method: method,
            params: params
        }
        wsManager.sendToUser(response, userId);
    }

    
    if(!userId){
        console.log('No userId found in data');
        return;
    }
    console.log(`User ${userId} says: ${data}`);1

    if(method === 'echo'){
       reply(params);
    }
    if(method === 'createUser'){
        const response = await createUser(userId, params.sdp);
        if(response){
            reply(response);

            Object.keys(users).forEach(key => {
                if(key !== userId){
                    wsManager.sendToUser({
                        id: Math.random().toString(36).substring(2, 8),
                        method: 'newUser',
                        params: {userId: userId}
                    }, key);
                }  
            });
        }
    }
    if(method === 'getUsers'){
        const usersDetails = getAllUsersDetails(userId, data);
        reply(usersDetails);
    }
    if(method == 'subscribe'){
        const userToSubscribe = users[params.userToSubscribe];
        const targetSlot = params.slot;

        const targetAudioSlot = targetSlot * 2;
        const targetVideoSlot = (targetSlot * 2) + 1

        if(userToSubscribe){
            subscribe(userToSubscribe, userId, targetAudioSlot, targetVideoSlot);
            reply({success: true});
        }
    }
   
}

async function createUser(userId, sdp){

    if(users[userId]){
        console.log(`User with id ${userId} already exists`);
        return;
    }
    const userDetails = {}
    users[userId] = userDetails;

    console.log(`Creating user with id: ${userId}`);
    

    const peer = new RTCPeerConnection();
    userDetails.pc = peer;

    const dummyAudioTrack = new MediaStreamTrackGenerator('audio');
    const dummyVideoTrack = new MediaStreamTrackGenerator('video');

    // for(let i = 0; i < MAX_USERS; i++){
    //     if(i == 0){
    //         peer.addTransceiver('audio', { direction: 'recvonly' });
    //         peer.addTransceiver('video', { direction: 'recvonly' });
    //     }
    //     else{
    //         peer.addTransceiver(dummyAudioTrack, { direction: 'sendonly' });
    //         peer.addTransceiver(dummyVideoTrack, { direction: 'sendonly' });
    //     }
    // }

    await peer.setRemoteDescription(sdp);


    peer.getTransceivers().forEach((transceiver, index) => {
        if(index > 1){
            if(index % 2 == 0){
                console.log(`replacing audio track ${index}`);
                transceiver.sender.replaceTrack(dummyAudioTrack);
                transceiver.direction = 'sendonly';
            }
            else{
                console.log(`replacing video track ${index}`);
                transceiver.sender.replaceTrack(dummyVideoTrack);
                transceiver.direction = 'sendonly';
            }
        }
    });

    peer.getTransceivers().forEach(transceiver => {
        const senderEncodedStream = transceiver.sender.createEncodedStreams();
        const receiverEncodedStream = transceiver.receiver.createEncodedStreams();
        
        console.log(transceiver.mid, `senderEncodedStream: ${senderEncodedStream} | receiverEncodedStream: ${receiverEncodedStream}`);

        transceiver.sender.__encodedStream = senderEncodedStream;
        transceiver.receiver.__encodedStream = receiverEncodedStream;
    });

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    await new Promise(res => {
        peer.onicegatheringstatechange = () => {
            if(peer.iceGatheringState === 'complete'){
                res();
            }
        }
    })

    return {
        sdp: peer.localDescription
    }

    
}

async function getAllUsersDetails(){

    const usersDetails = Object.keys(users).filter(id => id !== 'SFU')
    return usersDetails;
}

async function subscribe(userToSubscribe, targetPeerId,targetAudioSlot, targetVideoSlot){
    const sourcePeer = userToSubscribe.pc;
    const targetPeer = users[targetPeerId].pc;

    console.log(`subscribing to user ${userToSubscribe} in slot ${targetAudioSlot} and ${targetVideoSlot}`);
    console.log('sourcePeer', sourcePeer);
    console.log('targetPeer', targetPeer);

    const sourceAudioEncodedStream = sourcePeer.getTransceivers()[0].receiver.__encodedStream;
    const sourceVideoEncodedStream = sourcePeer.getTransceivers()[1].receiver.__encodedStream;

    const targetAudioEncodedStream = targetPeer.getTransceivers()[targetAudioSlot].sender.__encodedStream;
    const targetVideoEncodedStream = targetPeer.getTransceivers()[targetVideoSlot].sender.__encodedStream;

    sourceAudioEncodedStream.readable.pipeTo(targetAudioEncodedStream.writable);
    sourceVideoEncodedStream.readable.pipeTo(targetVideoEncodedStream.writable);
    
    console.log(`Subscribed to user ${userToSubscribe} in slot ${targetAudioSlot} and ${targetVideoSlot}`);
}