'use strict';

const drone = req("app/DroneInterface");
const VehicleShell = req("lib/drone/VehicleShell");
const { SolexCC, WorkerCommand } = req("solexcc/SolexCC");

const WORKER_ID = "leds";
const MSG_LED = "run_led";
const MSG_LIST = "list_modes";
const MSG_COMMAND = "led_command";

let mOutputCallback = null;

function processLEDCommand(input, callback) {
    const words = input.split(" ");
    const vehicle = VehicleShell.getCurrentVehicle();
    const state = VehicleShell.getState(vehicle);
    const userVehicle = drone.getUserVehicle(vehicle);

    // led (mode)
    // led list
    // led default
    if (words.length >= 2) {
        const solexCC = userVehicle.getAvailableCC();
        if (!solexCC) return callback(`${vehicle.getName()} does not have SolexCC.`);

        const thing = words[1];

        switch(thing) {
            case "list": {
                solexCC.sendWorkerCommand(new WorkerCommand(WORKER_ID, MSG_LIST, {}), {
                    onSuccess: (command, response) => {
                        const output = response.content && response.content.output;
                        if(output) {
                            callback(output);
                        } else {
                            callback(`No LED modes found?`);
                        }
                    },

                    onFailure: (command, response) => {
                        callback(`Failed to list LED modes`);
                    }
                });
                break;
            }

            case "command": {
                if(words.length >= 3) {
                    const command = words.slice(2).join(" ");

                    solexCC.sendWorkerCommand(new WorkerCommand(WORKER_ID, MSG_COMMAND, { command: command }), {
                        onSuccess: (command, response) => {
                            callback("OK");
                        },

                        onFailure: (command, response) => {
                            callback(`Failed to send LED command`);
                        }
                    });
                } else {
                    callback(usage());
                }
                break;
            }

            default: {
                solexCC.sendWorkerCommand(new WorkerCommand(WORKER_ID, MSG_LED, { item_id: thing }), {
                    onSuccess: (command, response) => {
                        callback(`Set LEDs to ${thing}`);
                    },

                    onFailure: (command, response) => {
                        callback(`Failed to set LEDs to ${thing}`);
                    }
                });
                break;
            }
        }
    } else {
        callback(usage());
    }
}

exports.setOutputCallback = (callback) => {
    mOutputCallback = callback;
}

exports.processCommand = (input, callback) => {

    if(input.startsWith("led ")) {
        processLEDCommand(input, callback);
    }

    callback(null);
};

exports.handlesKeyword = (word) => word.toLowerCase() == "led";

exports.getHelp = () => {
    return `led\tLED commands\t${usage()}`;
}

function usage() {
    return `Usage: 
led (mode | default | list | command [command])
.   [mode] is the name of an LED mode.
.   "list" returns a list of available modes.
.   "default" reverts back to default LED handling on the vehicle.
.   "command [command]" sends a command directly to the LED controller
`;
}

