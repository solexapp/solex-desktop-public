'use strict';

let buttonArea;
let vehicleArmed = false;

exports.onLoad = () => {
    buttonArea = $("#upper_right_controls");

    buttonArea
    	.css("color", "white")
    	.css("background-color", "red")
    	.css("opacity", "80%")
    	.css("padding", "8px")
    	.css("height", "30px")
    	.css("min-height", "30px")
    	;
};

exports.onUnload = () => {
    // Unload the module
};

exports.onVehicleSelected = (vehicle) => {
	// Vehicle was selected
};

exports.onState = (vehicle, state) => {
	if(state.armed != vehicleArmed) {
		vehicleArmed = state.armed;

		if(vehicleArmed) {
			buttonArea.html("Drive safely!");
			buttonArea.show(300);
		} else {
			buttonArea.html("Vehicle is disarmed");
			buttonArea.hide(300);
		}
	}
};

