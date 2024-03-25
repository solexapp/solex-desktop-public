'use strict';

const { LocationSource } = req("lib/locations/LocationSource");
const drone = req("app/DroneInterface");
const MathUtils = req("lib/util/MathUtils");

const TAG = "CircleLocationSource";

function d(str) { console.log(`${TAG}: ${str}`); }
function e(str) { console.error(`${TAG}: ${str}`); }

let currHeading = 0;
let currRadius = 100;

const SOURCE_ID = "circle";

const LISTENER_ID = "TestLocationSource";
const droneListener = {
    onState: (vehicle, state) => {
        // e(`onState(): ${JSON.stringify(state.location)}`);

        const location = state.location;
        if(location) {
            const where = MathUtils.newCoordFromBearingAndDistance(location, currHeading, currRadius);
            const msg = {
                source: {
                    id: SOURCE_ID,
                },
                where: where
            };
            
            // e(`heading: ${currHeading}`);

            LocationSource.get().onExternalSourceLocationUpdate(msg);

            currHeading += 10;
            if(currHeading >= 360) {
                currHeading = 0;
            }
        }
    }
};

exports.start = () => {
    drone.addDroneListener(LISTENER_ID, droneListener);
    return `${SOURCE_ID} started`;
}

exports.stop = () => {
    drone.removeDroneListener(LISTENER_ID);
    return `${SOURCE_ID} stopped`;
}

exports.getInfo = () => {
    return {
        id: SOURCE_ID,
        name: "Circle location source",
        description: "Generates a location that moves in a clockwise circle around the vehicle's current location, for testing"
    };
}

exports.handleCommand = (words) => {
    if(!words[0]) return `${SOURCE_ID}: No command to handle`;

    const first = words[0];
    if(first.includes("=")) {
        const t = first.split("=");
        switch(t[0]) {
            case "radius": {
                const radius = parseInt(t[1]);
                if(!isNaN(radius)) {
                    currRadius = radius;
                    return `${SOURCE_ID}: radius updated to ${radius}`;
                } else {
                    return `${SOURCE_ID}: radius must be a number`;
                }
                break;
            }

            default: {
                return `Don't know what to do with ${t[0]}`;
            }
        }
    } else {
        return `${SOURCE_ID}: Don't know what to do with ${words.join(" ")}`;
    }
}
