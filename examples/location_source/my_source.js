#!/usr/bin/env node
'use strict';

// Example app that reads a CSV file containing the following on each line:
// lat,lng,alt,heading,speed
// ...and posts to the /location endpoint on the local server.

const fs = require("fs");
const readline = require("readline");
const path = require("path");
const http = require("http");

function run(filename, sourceId, sourceName, server, port) {
    if(!fs.existsSync(filename)) return die(`${filename} not found`);

    function processLinesIn(filename) {
        const stream = fs.createReadStream(filename);

        const reader = readline.createInterface({
            input: stream,
            crlfDelay: Infinity
        });

        const options = { host: server, port: port, method: "POST" };

        reader.on("line", function(line) {
            if(line.startsWith("#")) return;

            console.log(`line=${line}`);

            // const parts = line.split(",");
            // if(parts.length >= 5) {
            //     // Line contains lat, lng, alt, heading, speed
            //     const body = {
            //         source: { id: sourceId, name: sourceName },
            //         where: {
            //             lat: parts[0], 
            //             lng: parts[1], 
            //             alt: parts[2],
            //             heading: parts[3],
            //             speed: parts[4]
            //         }
            //     };
            // }
        });
    }

    processLinesIn(filename);
}

function die(reason, exitCode) {
    console.error(reason);
    process.exit(exitCode || 127);
}

function usage() {
    return `\nUsage:\n${path.basename(__filename)} filename source_id "Source Name" server port\n`;
}

if(process.argv.length < 7) {
    die(usage());
} else {
    const argv = process.argv;
    const filename = argv[2];
    const sourceId = argv[3];
    const sourceName = argv[4];
    const server = argv[5];
    const port = argv[6];
    run(filename, sourceId, sourceName, server, port);
}

