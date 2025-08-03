
const WS_PORT = 8081;

class WSManager extends EventTarget {
    ws = new WebSocket(`ws://localhost:${WS_PORT}`);

    constructor() {
        super()
        this.ws.onopen = this.#handleWSOpen.bind(this);
    }

    #handleWSOpen(){
        console.log('WebSocket connection established');

        // TODO: do some kind of auth here!
        this.#initializeSFU();
        
        this.ws.onmessage = (event) => {
            console.log(`Received message: ${event.data}`);
        
            const data = JSON.parse(event.data);
            
            const e = new CustomEvent('message', {detail: data});
            this.dispatchEvent(e);
        
        }

    }

    #initializeSFU(){
        const init = {
            id: 1,
            userId: 'SFU',
            method: 'initialize',
            params: null
        }
        this.ws.send(JSON.stringify(init))
    }

    sendToUser(data, userId){
        data.to = userId;
        this.ws.send(JSON.stringify(data));
    }
    
    

}