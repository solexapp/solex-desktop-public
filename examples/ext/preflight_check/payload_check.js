'use strict';

const VehicleStateData = req("lib/drone/VehicleStateData");

const VERBOSE = true;
const { d, e, t } = req("lib/util/ConsoleLog").setup(__filename, VERBOSE);

// Properties to add to global vehicle state for monitoring by preflight checklist items
exports.getStateProperties = () => {
	return {
		"mypayload": {
			"ready": 0,
			"status": 0
		},
		"laser": {
			"status": 0
		}
	}
};

let timerHandle = null;

exports.onVehicleConnected = (vehicle, connected) => {
	t(`onVehicleConnected(${connected})`);

	if(connected) {
		timerHandle = setTimeout(() => {
			// Status gathered from attached fictional laser device
			const laser = {
				status: 3
			};

			VehicleStateData.writeData(vehicle, "laser", laser);
		}, 15000)
	} else {
		clearTieout(timerHandle);
	}
};

