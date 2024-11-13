'use strict';

const path = require("path");

const TAG = "DemoTelemBar";
const d = (str) => console.log(`${TAG}: ${str}`);
const e = (str) => console.error(`${TAG}: ${str}`);

function DemoTelemBar() {
    const PAGE_ID = "telembar";
    const LISTENER_ID = "TelemBar";

    const AppSettings = remote_req("app/settings/app_settings");
    const { hex } = remote_req("lib/util/Strings");

    const fldSpeed = $("#fld_speed");
    const fldVSpeed = $("#fld_vspeed");
    const fldAltitude = $("#fld_altitude");
    const fldBattery = $("#fld_battery");
    const fldGPS = $("#fld_gps");
    const fldSignal = $("#fld_signal");
    const fldMode = $("#fld_mode");

    let mVehicle = Vehicle.getCurrentVehicle();

    const minAltitude = AppSettings.getMinimumAltitude();

    const fieldIds = $("[tag]");
    fieldIds.each(function () {
        const v = $(this).attr("tag");
        if (excludedFields.indexOf(v) != -1 || hiddenFields.indexOf(v) != -1) {
            $(this).hide();
        }
    });

    const state = Vehicle.getState();
    if (state) {
        doOnState(Vehicle.getCurrentVehicle(), state);
    }

    setPageCallback(PAGE_ID, {
        onClose: () => {
            d(`${LISTENER_ID}::onClose()`);
            drone.removeDroneListener(LISTENER_ID);
        }
    });

    drone.addDroneListener(LISTENER_ID, {
        onVehicleSelected: doOnVehicleSelected,
        onSpeed: doOnSpeed,
        onAltitude: doOnAltitude,
        onSignal: doOnSignal,
        onBattery: doOnBattery,
        onState: doOnState,
    });

    function doOnSignal(vehicle, data) {
        if (vehicle !== mVehicle) return;

        // Normally hidden
        fldSignal.show();

        fldSignal.text(`${data.rssi.toFixed(0)}dB`);

        const title = `Fixed:\t${data.fixed.toFixed(0)}\nREM RSSI:\t${data.remrssi}\nNoise:\t${data.noise}\n\tREM Noise:\t${data.remnoise}\nRX Errors:\t${data.rxErrors}`;
        fldSignal.prop("title", title);
    }

    function doOnAltitude(vehicle, data) {
        if (vehicle != mVehicle) return;

        fldAltitude.text(`${UnitDisplay.getDistance(data.altAGL)}`);

        // Make the alt field's color look error-y if the altitude is at/below a safe altitude.
        const css = { color: "white" };
        if (vehicle.fliesAboveGround() && vehicle.isFlying()) {
            const alt = vehicle.getAltAGL();
            const altDiff = (minAltitude - alt);

            if (altDiff >= 0) {
                const green = (0xFF * (alt / minAltitude));
                css.color = `#FF${hex(green)}00`;
            }
        }

        const title = `Alt AMSL:\t${UnitDisplay.getDistance(data.altMSL)}`;
        fldAltitude.css(css).prop("title", title);
    }

    function doOnSpeed(vehicle, data) {
        if (vehicle !== mVehicle) return;

        fldSpeed.text(`${UnitDisplay.getSpeed(data.groundSpeed)}`);

        const title = `Air:\t${UnitDisplay.getSpeed(data.airSpeed)}\nGnd:\t${UnitDisplay.getSpeed(data.groundSpeed)}`;
        fldSpeed.prop("title", title);
    }

    function doOnVehicleSelected(vehicle, data) {
        mVehicle = vehicle;
        fillModeCombo();
        updateVehicleButtons(vehicle);
    }

    function doOnBattery(vehicle, batt) {
        if (vehicle != mVehicle) return;

        let current = batt.current.toFixed(1);
        let str = (current > 0) ?
            `${batt.voltage.toFixed(1)}V, ${batt.current.toFixed(1)}A` :
            `${batt.voltage.toFixed(1)}V`;

        const percent = batt.percent_capacity || batt.remaining;

        if (percent > 0) {
            str += ` ${percent}%`;
            mHasBatteryPercentage = true;
        }

        mBattRemaining = percent;

        fldBattery.text(str);

        if (current > 0) {
            const title = `Watts:\t${(batt.voltage * batt.current).toFixed(0)}`;
            fldBattery.prop("title", title);
        }
    }

    function doOnGps(vehicle, gps) {
        const str = `${gps.satellites}, ${gps.eph}`;

        fldGPS.text(str);

        const title =
            `Satellites:\t${gps.satellites}\nGPS Lock:\t${gps.fixTypeText}\nHDOP:\t\t${gps.eph}\nVDOP:\t\t${gps.epv}\nCourse:\t${gps.cog}`;

        fldGPS.prop("title", title);
    }

    function doOnState(vehicle, state) {
        if (vehicle != mVehicle) return;

        fldMode.text(`${state.mode.name.toUpperCase()}`);

        const vel = state.location.velocity;
        if (vel) {
            const vms = vel.z / 100;
            const str = (vms == 0) ? `\u2014 ${UnitDisplay.getSpeed(0)}` :
                `${vms > 0 ? "\u25bc" : "\u25b2"} ${UnitDisplay.getSpeed(Math.abs(vms))}`;
            fldVSpeed.text(str);
        }

        const gps = state.gps;
        if (gps) {
            doOnGps(vehicle, gps);
        }

        const batt = state.battery;
        if (batt) {
            doOnBattery(vehicle, batt);
        }
    }
}

class DemoTelemBar {
    constructor() { }

    onPageCreate() {
        $("#telem_bar").load(path.join(__dirname, "demotelembar.html"), function() {
            DemoTelemBar();
        });
    }

    onPageClose() {

    }
}

exports.newInstance = () => new DemoTelemBar();
exports.getInfo = () => {
    return {
        id: "demo",
        name: "demo",
        description: "Demo telemetry bar"
    };
}
