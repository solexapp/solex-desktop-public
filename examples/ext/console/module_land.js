'use strict';

const VehicleShell = req("lib/drone/VehicleShell");

function performLandCommand() {
    VehicleShell.land();
    return "Start landing"; // Always return a value, otherwise the console will report that the command is not understood.
}

exports.processCommand = (input) => {
    if(input.toLowerCase() == "land") {
        return performLandCommand();
    }

    return null;
};

exports.handlesKeyword = (word) => word.toLowerCase() == "land";

exports.getHelp = () => {
    return `land\tLand the vehicle\tUsage: land`;
}

