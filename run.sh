# kill if already running
kill -9 $(lsof -t -i:15001)
kill -9 $(lsof -t -i:15000)

# Start the static server for the SFU
SFU_PORT=15001
cd ./src/sfu
python3 -m http.server $SFU_PORT --bind 127.0.0.1 >> /dev/null &
echo "SFU static server is running at http://localhost:$SFU_PORT. Open this URL in a browser to start the SFU."
cd ../../

# Open client in a browser
CLIENT_STATIC_PORT=15000
cd ./src/client
python3 -m http.server $CLIENT_STATIC_PORT >> /dev/null &
echo "Client is running at http://localhost:$CLIENT_STATIC_PORT. Open this URL in a browser to start the client."
cd ../../

# Start the signalling server
cd ./src/node
node signalling-server.js


