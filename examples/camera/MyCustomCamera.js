'use strict';

const { CameraInterface } = require("app/video/CameraInterface");

class MyCustomCamera extends CameraInterface {
    constructor() {
        super();
    }
    
    takePicture(callback) {
        callback(new Error("Someday, I should implement this"), false);
    }
    
    toggleRecording(callback) {
        callback(new Error("Hi, I can't record video"), false);
    }
    
    isRecording() { return false; }
}

exports.newInstance = () => { return new MyCustomCamera(); }

