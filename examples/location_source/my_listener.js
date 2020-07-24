#!/usr/bin/env node
'use strict';

// Listener for locations. Connects to the server via a websocket and subscribes to location data.
// TO USE: 
// Start Solex, and make a note of the webserver port it uses (see Settings). The default is 2112.
// Start this program as follows (note, you need NodeJS installed):
// node my_listener.js (ip of machine where Solex is running) (port + 1)
// for example: 
// node my_listener.js localhost 2113
//
// The console will location data whenever it updates, along with the ID and name of the location 
// source sending the data.

const path = require("path");
const WebSocket = require("ws");

function die(reason, exitCode) {
    console.error(reason);
    process.exit(exitCode || 127);
}

function lineOutput(msg) {
    let jo;
    try {
        jo = JSON.parse(msg);
    } catch(ex) {
        die(ex.message);
    }

    // Make a comma-delimited line out of the JSON we got from the server.
    let line = `${jo.source.id},`;

    if(jo.where) {
        ["lat", "lng", "alt", "heading"].forEach((prop) => {
            line += `${jo.where[prop]},`;
        });

        line += jo.where["speed"];
    }

    return line;
}

function run(server, port) {
    const url = `ws://${server}:${port}/location`;
    const connection = new WebSocket(url);

    connection.on("open", () => {
        console.log("Connection opened");
    });

    connection.on("error", (err) => {
        console.error(`Connection error: ${err}`);
    });

    connection.on("message", (msg) => {
        // Just to log the data
        // console.log(`message: ${msg}`);
        console.log(lineOutput(msg));
    });

    connection.on("close", () => {
        console.log("Connection closed");
    });
}

function usage() {
    return `\nUsage:${path.basename(__filename)} server port`;
}

if(process.argv.length < 4) {
    die(usage());
} else {
    const argv = process.argv;
    const server = argv[2];
    const port = argv[3];

    run(server, port);
}
