'use strict';

const path = require("path");
const ConsoleLog = req("lib/util/ConsoleLog");
const { Gamepad } = req("lib/gamepad/gamepad");

const VERBOSE = false;
const TAG = path.basename(__filename, ".js");
function d(str) { ConsoleLog.d(TAG, str); }
function e(str) { ConsoleLog.e(TAG, str); }
const t = (str) => { if (VERBOSE) e(str); }

const buttonNames = [
    "b0",
    "b1",
    "b2",
    "b3",
    "b4",
    "b5",
    "b6",
    "b7",
    "b8",
    "b9",
    "b10",
    "b11",
    "b12",
    "b13",
    "b14"
];

const axisNames = [
    "stick_left_updown",
    "stick_left_lr",
    "stick_right_lr",
    "stick_right_updown",
    "wheel_left",
    "wheel_right"
];

const stateName = (value) => (value) ? "down" : "up";

class TTGamepad extends Gamepad {
    constructor() {
        super();
        this.running = false;
    }

    start() {
        this.running = true;
    }

    stop() {
        this.running = false;
    }

    onButtonEvent(event) {
        t(`onButtonEvent(): ${JSON.stringify(event)}`);

        if (this.running) {
            const buttonName = buttonNames[event.button];
            const eventName = `${buttonName}:${stateName(event.value)}`;
            // Button
            this.emit(eventName, event.value);
            // Switch
            this.emit(buttonName, event.value);
            // Raw
            this.emit("event", { event: eventName, value: event.value });
        }
    }

    onAxisEvent(event) {
        t(`onAxisEvent(): ${JSON.stringify(event)}`)
        if (this.running) {
            const eventName = `${axisNames[event.axis]}`;
            this.emit("stick", { name: eventName, value: event.value });
            this.emit(eventName, event.value);

            const alias = eventAliases[eventName];
            if (alias && alias.event && alias.axis) {
                this.emit(alias.event, { value: event.value, axis: alias.axis });
                this.emit("event", { event: `${alias.event}:${alias.axis}`, value: event.value });
            } else {
                this.emit("event", { event: eventName, value: event.value });
            }
        }
    }

    buttonNames() { return buttonNames; }
    stickNames() { return axisNames; }
}

exports.TTGamepad = TTGamepad;

exports.getType = () => {
    return {
        id: "demo", name: "Demo Gamepad"
    };
}

exports.newInstance = () => new TTGamepad();

exports.getEventTypes = () => {
    return [
        { event: "b0:down", name: "Red front left", type: "button" },
        { event: "b1:down", name: "Red front right", type: "button" },
        { event: "b2:down", name: "Red rear left", type: "button" },
        { event: "b3:down", name: "Red rear right", type: "button" },
        { event: "b4:down", name: "Red shoulder", type: "button" },
        { event: "b5:down", name: "SwitchL down", type: "button" },
        { event: "b5:up", name: "SwitchL up", type: "button" },
        { event: "b5", name: "SwitchL", type: "switch" },
        { event: "b6:down", name: "SwitchR down", type: "button" },
        { event: "b6:up", name: "SwitchR up", type: "button" },
        { event: "b6", name: "SwitchR", type: "switch" },
        { event: "b7:down", name: "B7 down", type: "button" },
        { event: "b8:down", name: "B8 down", type: "button" },
        { event: "b9:down", name: "BottomLeft 1", type: "button" },
        { event: "b10:down", name: "BottomLeft 2", type: "button" },
        { event: "b11:down", name: "BottomLeft 3", type: "button" },
        { event: "b12:down", name: "BottomRight 1", type: "button" },
        { event: "b13:down", name: "BottomRight 2", type: "button" },
        { event: "b14:down", name: "BottomRight 3", type: "button" },
        // axes
        { event: "stick_left", name: "Joystick left", type: "stick", events: [ "stick_left_lr", "stick_left_updown" ] },
        { event: "stick_right", name: "Joystick right", type: "stick", events: [ "stick_right_lr", "stick_right_updown" ] },
        { event: "wheel_left", name: "Wheel left", type: "stick" },
        { event: "wheel_right", name: "Wheel right", type: "stick" },
    ];
};
