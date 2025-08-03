
# SFU (Selective Forwarding Unit) in the Browser

  

This project demonstrates a simple SFU (Selective Forwarding Unit) running entirely inside a browser, communicating with a Node.js-based WebSocket signalling server. The SFU manages multiple users, relays media streams, and allows for basic subscription to other users' streams.

  

## Features

  

-  **Browser-based SFU**: The SFU logic runs in the browser using JavaScript and WebRTC APIs.

-  **WebSocket Signalling**: Uses a Node.js WebSocket server for signalling between clients and the SFU.

-  **User Management**: Handles user creation, listing, and subscription to other users' media streams.

-  **Media Forwarding**: Forwards encoded audio and video streams between users using WebRTC's encoded streams API.

  

## Project Structure

  

```

WebSFU/

├── package.json # Node.js dependencies and scripts

├── run.sh # Quick start script

├── src/

│ ├── client/ # Client application files

│ │ ├── client-page.html # Client HTML interface

│ │ ├── client-script.js # Client WebRTC logic

│ │ └── client-styles.css # Client styling

│ ├── node/ # Node.js signaling server

│ │ └── signalling-server.js # WebSocket signaling server

│ └── sfu/ # Browser-based SFU implementation

│ ├── sfu.html # SFU HTML interface

│ ├── sfu-user-manager.js # User management and WebRTC handling

│ └── sfu-ws-manager.js # WebSocket communication manager

```

  

## Installation

  

1.  **Clone the repository**

```bash

git clone <repository-url>

cd WebSFU

```

  

2.  **Install dependencies**

```bash

npm install

```

  

## Quick Start

  

### Using the run script (recommended)

```bash

chmod  +x  run.sh

./run.sh

```
1. Now, in the server, open `localhost:15001/sfu.html` in a browser (preferably in headless mode).

2. `client-page.html` is served on port `15000`. Open it from a browser, in the client.

  

### Or manually

1. Start the signalling server
```bash
node  src/node/signalling-server.js
```

2. Inside `src/sfu` directory, start a static server for SFU.
```bash
python3 -m http.server 15001 --bind 127.0.0.1
```
note that we are listening only in localhost to prevent the SFU page from being accessed outside the local machine.

3. Inside `src/client` directory, start a static server for client files. (You might want to setup HTTPS in production)
```bash
python3 -m http.server 15001
```

4. Now, in the server, open `localhost:15001/sfu.html` in a browser (preferably in headless mode).

5. `client-page.html` is served on port `15000`. Open it from a browser, in the client.



  

## Usage

  

### Starting a Conference

  

1.  **Start the signaling server**

```bash

./run.sh

# Server will start on ws://localhost:8081

```

  

2.  **Open the SFU in a browser**

- Open `sfu.html` in your browser

- This initializes the SFU that will manage media forwarding

  

3.  **Connect clients**

- Open `client-page.html` in multiple browser tabs/windows

- Each client will automatically connect and request camera/microphone access

- Clients will automatically subscribe to other users' streams

  

### Architecture Flow

  

1.  **Signaling Server** (`signalling-server.js`): WebSocket server that relays messages between clients and the SFU

2.  **SFU** (`sfu/`): Browser-based SFU that manages user connections and forwards media streams

3.  **Clients** (`client/`): Individual users connecting to the conference

  

## Technical Details

  

### Constants and Configuration

  

-  **Maximum Users**: 5 users per conference (configurable via `MAX_USERS`)

-  **WebSocket Port**: 8081 (configurable via `WS_PORT`)

-  **Media Tracks**: Audio and video transceivers for each user slot

  

### WebRTC Implementation

  

- Uses WebRTC `RTCPeerConnection` for media transmission

- Implements transceiver-based approach for scalable media forwarding

- First transceiver pair (audio/video) is bidirectional for the local user

- Additional transceiver pairs are receive-only for remote users

  

### Message Protocol

  

#### Client to SFU Messages

```javascript

// Create user connection

{

id: <unique-id>,

userId: <user-id>,

method: "createUser",

params: {  sdp: <offer-sdp> }

}

  

// Subscribe to another user

{

id: <unique-id>,

userId: <user-id>,

method: "subscribe",

params: {  userToSubscribe: <target-user-id>, slot: <slot-number> }

}

```

  

#### SFU to Client Messages

```javascript

// New user notification

{

method: "newUser",

params: { userId: <new-user-id> }

}

  

// Subscription response

{

id: <request-id>,

method: "subscribe",

params: {  success: true|false  }

}

```

  

## Known Issues and TODOs

  

-  **Security**: User validation is currently insecure (marked as TODO in signaling server)

-  **Slot Management**: Should be 0-indexed instead of 1-indexed (TODO in client)

-  **Error Handling**: Limited error handling for WebRTC connection failures

-  **User Disconnection**: No cleanup logic for disconnected users

-  **Media Quality**: No adaptive bitrate or quality controls