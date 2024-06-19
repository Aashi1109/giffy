#!/bin/sh

# Function to reset db.json every hour
reset_db() {
  while true; do
    echo '{ "tasks": [] }' > /app/db.json
    sleep 3600
  done
}

# Run reset_db function in the background
reset_db &

# Start json-server on the port specified in the .env file
npx json-server /app/db.json --port "${JSON_SERVER_PORT}" &

# Start main server
node index.js
