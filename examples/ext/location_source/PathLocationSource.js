'use strict';

const { LocationSource } = req("lib/locations/LocationSource");
const drone = req("app/DroneInterface");
const MathUtils = req("lib/util/MathUtils");

const TAG = "PathLocationSource";

function d(str) { console.log(`${TAG}: ${str}`); }
function e(str) { console.error(`${TAG}: ${str}`); }

let sideDistance = 100;
let startLocation = null;
let points = [];
let pointIndex = 0;
let speedMS = 5; // TODO: Make this adjustable via commands
let updateInterval = 1000/speedMS;
let sendInterval = 1000; // ms

const SOURCE_ID = "testpath";
const LISTENER_ID = "TestLocationSource";

function sendPoint(pt) {
    LocationSource.get().onExternalSourceLocationUpdate({
        source: {
            id: SOURCE_ID,
        },
        where: pt
    });
}

let lastSendTime = 0;
let runnerHandle = null;
function pointRunner() {
    if(pointIndex < points.length - 1) {
        ++pointIndex;
    } else pointIndex = 0;

    const now = Date.now();
    if((now - lastSendTime) > sendInterval) {
        sendPoint(points[pointIndex]);
        lastSendTime = now;
    }

    runnerHandle = setTimeout(pointRunner, updateInterval);
}

function reset() {
    startLocation = null;
    clearTimeout(runnerHandle);
}

function generatePathBetween(start, end, speedMs) {
    const output = [];
    const distance = MathUtils.getDistance2D(start, end);
    const heading = MathUtils.getHeadingFromCoordinates(start, end);
    const stepSize = 1;
    
    for(let dist = stepSize; dist < distance; dist += stepSize) {
        output.push(MathUtils.newCoordFromBearingAndDistance(start, heading, dist));
    }

    return output;
}

const droneListener = {
    onState: (vehicle, state) => {
        const here = state.location;
        if (here) {
            if(!startLocation) {
                startLocation = { lat: here.lat, lng: here.lng, alt: here.alt }

                const nw = MathUtils.newCoordFromBearingAndDistance(startLocation, 270+45, sideDistance * 0.75);
                const ne = MathUtils.newCoordFromBearingAndDistance(nw, 90, sideDistance);
                const se = MathUtils.newCoordFromBearingAndDistance(ne, 180, sideDistance);
                const sw = MathUtils.newCoordFromBearingAndDistance(se, 270, sideDistance);

                // TODO: Put all the points 
                points = [nw];

                const source = [ nw, ne, se, sw ];
                for(let i = 0; i < source.length; ++i) {
                    const start = source[i];
                    const next = (i < source.length - 1)? source[i + 1]: source[0];

                    generatePathBetween(start, next, speedMS).forEach(pt => points.push(pt));
                }

                pointIndex = 0;
                
                // e(`set points complete: ${JSON.stringify(points)}`);
                // sendPoint(points[pointIndex]);
                pointRunner();
            }
        }
    }
};

exports.start = () => {
    e(`start()`);

    clearTimeout(runnerHandle);
    startLocation = null;
    drone.addDroneListener(LISTENER_ID, droneListener);
    
    return `${SOURCE_ID} started`;
}

exports.stop = () => {
    e(`stop()`);

    clearTimeout(runnerHandle);
    drone.removeDroneListener(LISTENER_ID);
    startLocation = null;
    return `${SOURCE_ID} stopped`;
}

exports.getInfo = () => {
    return {
        id: SOURCE_ID,
        name: "Test location source",
        description: "Generates a square path to test follow functions"
    };
}

exports.handleCommand = (words) => {
    if (!words[0]) return `${SOURCE_ID}: No command to handle`;

    const first = words[0];
    if (first.includes("=")) {
        const t = first.split("=");
        switch (t[0]) {
            case "distance": {
                const distance = parseInt(t[1]);
                if (!isNaN(distance)) {
                    sideDistance = distance;
                    reset();
                    return `${SOURCE_ID}: distance updated to ${distance}`;
                } else {
                    return `${SOURCE_ID}: distance must be a number`;
                }
            }

            case "speed": {
                const speed = parseInt(t[1]);
                if(!isNaN(speed)) {
                    speedMS = speed;
                    updateInterval = 1000 / speed;
                    return `${SOURCE_ID}: speed updated to ${speed} m/s`;
                } else {
                    return `${SOURCE_ID}: speed must be a number`
                }
            }

            case "interval": {
                const interval = parseInt(t[1]);
                if(!isNaN(interval)) {
                    sendInterval = interval;
                    return `${SOURCE_ID}: interval updated to ${interval} ms`;
                } else {
                    return `${SOURCE_ID}: interval must be a number`
                }
            }

            default: {
                return `Don't know what to do with ${t[0]}`;
            }
        }
    } else {
        return `${SOURCE_ID}: Don't know what to do with ${words.join(" ")}`;
    }
}
