'use strict';

const fs = require("fs");
const path = require("path");
const ConsoleLog = req("lib/util/ConsoleLog");
const DroneInterface = req("app/DroneInterface");
const VehicleShell = req("lib/drone/VehicleShell");
const { CameraControl } = req("app/video/CameraControl");

const TAG = path.basename(__filename, ".js");
const VERBOSE = false;
const d = (str) => ConsoleLog.d(TAG, str);
const e = (str) => ConsoleLog.e(TAG, str);
const t = (str) => { if(VERBOSE) e(str); }

const serviceState = {
    armed: false,
    flying: false,
    running: false
};

const serviceConfig = {
    enabled: false,
    photo_interval_seconds: 1
};

const LISTENER_ID = "com.solex.example.TimedPhoto";
const droneListener = {
    onState: (vehicle, state) => {
        // d(`onState(): ${JSON.stringify(state)}`);
        if(state.armed !== serviceState.armed) {
            onArmChanged(state.armed);
            t(`armed=${serviceState.armed}`);
        }

        if(state.flying !== serviceState.flying) {
            onFlyingChanged(state.flying);
            t(`flying=${serviceState.flying}`);
        }
    }
};

let timerHandle = null;
function takePhoto() {
    t(`takePhoto()`);
    CameraControl.get().takePicture((err, tookPic) => {
        if(err) e(err.message);
    });
}

function onFlyingChanged(flying) {
    serviceState.flying = flying;

    if(flying) {
        startService();
    } else {
        stopService();
    }
}

function startService() {
    t(`startService(): enabled=${serviceConfig.enabled}`);

    if(serviceConfig.enabled) {
        timerHandle = setInterval(takePhoto, (serviceConfig.photo_interval_seconds || 5) * 1000);
        serviceState.running = true;
    } else {
        t(`startService(): Not enabled`);
    }
}

function stopService() {
    t(`stopService()`);

    clearInterval(timerHandle);
    serviceState.running = false;
}

function onArmChanged(armed) {
    serviceState.armed = armed;
}

function getConfigFilename() {
    return path.join(__dirname, "timed_photo_config.json");
}

function loadConfig() {
    const filename = getConfigFilename();
    if(fs.existsSync(filename)) {
        try {
            const content = fs.readFileSync(filename);
            const jo = JSON.parse(content);
            Object.assign(serviceConfig, jo);
        } catch(ex) {
            e(ex.message);
        }
    }
}

function saveConfig() {
    try {
        fs.writeFileSync(getConfigFilename(), JSON.stringify(serviceConfig, null, 4));
    } catch(ex) {
        e(ex.message);
    }
}

/**
 * Module for taking timed photos that starts once the vehicle has taken off, and stops when the vehicle has 
 * landed.
 */

// Called when the app starts and this module is loaded. Return an identifier as shown.
exports.init = () => {
    loadConfig();

    return {
        id: "timed_photo",
        name: "Timed Photo",
        description: "Takes timed photos while flying",
        params: [
            { id: "enabled", name: "Enabled", type: "boolean", default: true, get: (x) => x.enabled, set: (x, value) => { x.enabled = value } },
            { id: "photo_interval_seconds", name: "Photo interval (s)", type: "number", default: 5, 
                get: (x) => x.photoInterval, 
                set: (x, value) => {
                x.photoInterval = value
                }
            },
            { id: "pick", name: "Pick field", type: "enum", 
                get: (x) => x.pick_field, 
                set: (x, value) => { x.pick_field = value },
                values: [
                    { id: "pick_1", name: "Pick 1" },
                    { id: "pick_2", name: "Pick 2" },
                    { id: "pick_3", name: "Pick 3" },
                ]
            }
        ]
    };
}

// Called when the app shuts down, before unload
exports.close = () => {
    t(`close()`)
}

exports.onVehicleConnectState = (vehicle, connected) => {
    t(`onVehicleConnectState(): connected=${connected}`);

    if (connected) {
        DroneInterface.addDroneListener(LISTENER_ID, droneListener);
    } else {
        DroneInterface.removeDroneListener(LISTENER_ID);
    }
}

exports.getConfig = () => {
    return serviceConfig;
}

exports.setConfig = (config) => {
    Object.assign(serviceConfig, config);
    e(`setConfig(): ${JSON.stringify(serviceConfig)}`);

    saveConfig();
    
    if(serviceState.flying) {
        stopService();
        startService();
    }
}

