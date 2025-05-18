#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const udp = require("dgram");
const client = udp.createSocket("udp4");

const DEF_HOST = "localhost"; // Would be something else in a real program
const DEF_PORT = 6789;

let host = DEF_HOST;
let port = DEF_PORT;

const d = (str) => console.log(str);

const usage = () => {
    d(`Usage: ${__filename} flightlog`);
    process.exit(1);
}

const args = process.argv.splice(2);

if(args.length == 0) {
    usage();
}

const file = args[0];
if(!fs.existsSync(file)) {
    d(`Error: ${file} not found`);
    process.exit(127);
}

const flightlog = JSON.parse(fs.readFileSync(file));
const locations = flightlog.locations;
const interval = flightlog.interval || 1000;
let locationIndex = 0;

function nextLocation() {
    if(++locationIndex >= locations.length) {
        locationIndex = 0;
    }

    return locations[locationIndex];
}

const output = {
    location: {
        // Don't remove this location source if idle/missing for up to 20s
        dead_time_ms: 20000,
        source: {
            id: "my_log",
            name: "Flightlog",
            description: "Follow this flight log"
        },
        where: {
            lat: 0, lng: 0, alt: 20
        }
    }
};

function updateData() {
    const where = output.location.where;
    const next = nextLocation();
    where.lat = next.lat;
    where.lng = next.lng;
    where.alt = next.alt;
}

function doOutput() {
    const str = JSON.stringify(output);
    d(str);
    client.send(str, port, host, (err) => {
        if (err) {
            console.error(err);
        }
    });
}

function run() {
    d(`Running with host ${host} and port ${port}`);
    updateData();
    doOutput();
    setInterval(updateData, interval);
    setInterval(doOutput, interval);
}

if(require.main == module) {
    run();
}
