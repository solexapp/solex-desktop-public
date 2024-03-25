'use strict';

const ConsoleLog = require("../../../lib/util/ConsoleLog");
const VehicleShell = require("../../../lib/drone/VehicleShell");

const TAG = require("path").basename(__filename, ".js");
const d = (str) => console.log(`${TAG}: ${str}`);
const e = (str) => console.error(`${TAG}: ${str}`);

const { 
    ButtonAction,
    SwitchAction,
    StickAction
} = require("../MappableActions");

const mappings = {};

// Just some fake modes to demonstrate editor fields
const typesModes = {
    "t1": [
        { id: "stabilize", name: "Stabilize" },
        { id: "loiter", name: "Loiter" },
        { id: "rtl", name: "RTL" }
    ],
    "t2": [
        { id: "manual", name: "Manual" },
        { id: "auto", name: "auto" },
        { id: "sport", name: "Sport" }
    ],
    "t3": [
        { id: "manual", name: "Manual" },
        { id: "fbwa", name: "FBWA" },
        { id: "fbwb", name: "FBWB" }
    ]
}

class DemoButtonAction extends ButtonAction {
    constructor() {
        super("Test Button");
        this.title = null;
        this.clicks = 0;
        this.type = "t1";
        this.mode = null;
        this.modesForType = typesModes[this.type];
        this.testbool = true;
        this.testnumber = 5;
    }

    // Example editable fields for an action. Useful for things like vehicle mode, takeoff altitude, etc where an action
    // has to be configured before it can be used.
    editorFields() {
        return {
            "title": { 
                name: "Title", type: "string", hint: "Title", get: (x) => x.title, set: (x, value) => { x.title = value } 
            },
            "type": {
                name: "Type", type: "enum", getValues: () => { return [
                    { id: "t1", name: "Type 1" },
                    { id: "t2", name: "Type 2" },
                    { id: "t3", name: "Type 3" },
                ] }, get: (x) => x.type, set: (x, value) => { x.setType(value) }
            },
            "mode": { 
                name: "Mode", type: "enum", getValues: () => this.modesForType, get: (x) => x.mode, set: (x, value) => { x.mode = value } 
            },
            "testbool": {
                name: "Bool", type: "boolean", get: (x) => x.testbool, set: (x, value) => { x.testbool = value }
            },
            "testnumber": {
                name: "Number", type: "number", get: (x) => x.testnumber, set: (x, value) => { x.testnumber = parseInt(value) }
            }
        };
    }

    // Short summary displayed in the mapping editor
    summary() {
        return `${this.title}`;
    }

    // Sets type from the editor field. Allows the object a chance to update dependent properties 
    // (in this case, available mode values)
    setType(value) {
        this.type = value;
        this.modesForType = typesModes[this.type];
        this.onFieldChanged("mode", this.modesForType);
    }

    // Read this action's configuration from JSON
    readFrom(jo) {
        this.title = jo.title || "No title";
        this.type = jo.type || "t1";
        this.modesForType = typesModes[this.type];
        this.mode = jo.mode;
        this.testbool = jo.testbool || true;
        this.testnumber = jo.testnumber || 5;
    }

    // This happens when the button is pressed.
    trigger(vehicle) {
        ++this.clicks;
        e(`${this.constructor.name}::trigger(): title=${this.title}: clicks=${this.clicks}`);
    }

    toString() { return `${this.constructor.name}` }
}

class DemoSwitchAction extends SwitchAction {
    constructor() {
        super("Test Switch");
    }

    // Switch was just turned on
    on(vehicle) { 
        e(`${this.constructor.name}::on()`); 
    }

    // Switch was just turned off
    off(vehicle) { 
        e(`${this.constructor.name}::off()`); 
    }
}

class DemoStickAction extends StickAction {
    constructor() {
        super("Test Stick");
    }

    // Stick was moved. Values will be from -1 to +1
    value(vehicle, value, axis) {
        e(`${this.constructor.name}::value(${value}, ${axis})`);
    }
}

// Mappings visible to the mapping editor
mappings["demo_button"] = { type: "button", id: "demo_button", name: "Demo Button", newInstance: () => new DemoButtonAction() };
mappings["demo_switch"] = { type: "switch", id: "demo_switch", name: "Demo Switch", newInstance: () => new DemoSwitchAction() };
mappings["demo_stick"] = { type: "stick", id: "demo_stick", name: "Demo Stick", newInstance: () => new DemoStickAction() };

exports.getActionTypes = () => mappings;
