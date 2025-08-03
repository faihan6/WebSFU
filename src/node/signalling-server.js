const WebSocket = require('ws');

const WS_PORT = 8081;

const users = {};

// WebSocket server
const wsServer = new WebSocket.Server({ port: WS_PORT });

wsServer.on('listening', () => console.log(`WebSocket server is listening on ws://localhost:${WS_PORT}`))
wsServer.on('connection', handleNewClient);

function handleNewClient(ws){
    console.log('New client connected, setting up handlers');
    ws.onmessage = handleMessage;
    ws.on('close', handleClientDisconnection);
}

function handleClientDisconnection(){
    console.log('Client disconnected');
}

function handleMessage(message){

    const ws = this;
    const data = JSON.parse(message.data);

    // TODO: INSECURE - need better validation
    if(data.userId === 'SFU'){
        if(data.method === 'initialize'){
            console.log('Initializing SFU');
            users['SFU'] = ws;
            ws.onmessage = handleSFUMessage
        }
    }
    else{
        users[data.userId] = ws;
        ws.onmessage = handleUserMessage
        handleUserMessage(message);
        
    }
}

function handleSFUMessage(event){
    
    const data = JSON.parse(event.data);
    const to = data.to;
    console.log(`Received message from SFU: ${event} | forwarding to ${to}`);

    const toUser = users[to];
    if(toUser){
        toUser.send(event.data);
    }
    else{
        console.log(`User ${to} not found`);
    }
    

}

function handleUserMessage(event){
    
    if(users['SFU']){
        console.log(`Forwarding message to SFU: ${event.data}`);

        // send as string
        users['SFU'].send(event.data);
    }
    else{
        console.log('SFU not initialized yet');
    }
    
}
