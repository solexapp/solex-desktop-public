'use strict';

exports.onLoad = () => {
    const buttonArea = $("#lower_right_controls");

    buttonArea.append("Lower-right controls").css("background-color", "purple").show();
};

exports.onUnload = () => {
    // Unload the module
};


