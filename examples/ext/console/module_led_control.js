'use strict';

const Vehicle = req("lib/drone/VehicleShell");
const { mavlink10 } = req("lib/mavlink/mavlink");
const mavlink = mavlink10;

function processLEDCommand(cmd) {
    const words = cmd.split(" ");
    if(words.length >= 3) {
        const instance = parseInt(words[1]);
        const pattern = parseInt(words[2]);

        if(isNaN(instance)) return `instance ${instance} must be a number.`;

        if(isNaN(pattern)) return `PWM must be a numeric value.`

        const vehicle = Vehicle.getCurrentVehicle();
        if(!vehicle) return `No vehicle`;

        const msg = new mavlink.messages.led_control(
            vehicle.sysid, 
            vehicle.compid,
            instance,
            pattern,
            0,
            ""
        );

        Vehicle.sendMavlinkMessage(msg);

        return `Sent LED_CONTROL instance=${instance} pattern=${pattern}`;
    } else {
        return "Usage: led_control (instance) (pattern)";
    }
}

exports.processCommand = (input) => {
    if (input.toLowerCase().startsWith("led_control ")) {
        return processLEDCommand(input);
    }

    return null;
};

exports.handlesKeyword = (word) => word.toLowerCase() == "led_control";

exports.getHelp = () => {
    return `led_control\tDo stuff to LEDs\tUsage: led_control instance pattern`;
}
