#!/usr/bin/env node
'use strict';

// Example app that reads a CSV file containing source_id/lat/lng/alt/heading/speed and sends a "location update"
// message to the local Solex server. To generate such a file, you can use the my_listener.js example in this folder.

// Start Solex, and make a note of the webserver port it uses (see Settings). The default is 2112.
// Start this program as follows (note, you need NodeJS installed):
// node examples/location_source/my_source.js output.txt my_source "My source" 500 localhost 2113
// This sends each location in the file to the server at a 500ms interval.

const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

function run(filename, sourceId, sourceName, interval, server, port) {
    if(!fs.existsSync(filename)) return die(`${filename} not found`);

    const url = `ws://${server}:${port}/location`;
    const connection = new WebSocket(url);

    connection.on("open", () => {
        console.log("Connection opened");
    });

    connection.on("error", (err) => {
       die(`Connection error: ${err}`, 1);
    });

    connection.on("close", () => {
        die("Connection closed", 0);
    });

    const content = fs.readFileSync(filename);
    const lines = content.toString('utf-8').split("\n");
    const count = lines.length;
    let lineIndex = 0;
    let intervalHandle;

    console.log(`lines.length=${count}`);

    function toMessage(line) {
        const parts = line.split(",");

        let i = 1;
        const out = {
            source: {id: sourceId, name: sourceName},
            where: {
                lat: parts[i++],
                lng: parts[i++],
                alt: parts[i++],
                heading: parts[i++]/* ,
                speed: parts[i++] */
            }
        }

        const msg = {
            type: "location",
            data: out
        };

        return JSON.stringify(msg);
    }

    function spitLine() {
        const msg = toMessage(lines[lineIndex++]);
        if(msg) {
            console.log(msg);
            // Send a message to the web socket for each valid location message.
            connection.send(msg);
        }

        if(lineIndex >= count-1) {
            clearInterval(intervalHandle);

            console.log(`done`);
            // Now that we're done, tell the server this is no longer a valid location source.
            // Anything listening to it will detach automatically.
            connection.send(JSON.stringify({
                type: "remove",
                data: {
                    source: {id: sourceId}
                }
            }));

            process.exit(0);
        }
    }

    // emit the lines at the specified interval.
    intervalHandle = setInterval(spitLine, parseInt(interval));
}

function die(reason, exitCode) {
    console.error(reason);
    process.exit(exitCode || 127);
}

function usage() {
    return `\nUsage:\n${path.basename(__filename)} filename source_id "Source Name" interval server port\n`;
}

if(process.argv.length < 8) {
    die(usage());
} else {
    const argv = process.argv;
    let i = 2;
    const filename = argv[i++];
    const sourceId = argv[i++];
    const sourceName = argv[i++];
    const interval = argv[i++];
    const server = argv[i++];
    const port = argv[i++];
    run(filename, sourceId, sourceName, interval, server, port);
}

