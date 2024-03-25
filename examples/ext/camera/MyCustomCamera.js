'use strict';

const { CameraInterface } = req("app/video/CameraInterface");

class MyCustomCamera extends CameraInterface {
    constructor() {
        super();
    }
    
    takePicture(callback) {
        callback(new Error("Hi, I'm the custom camera that does nothing"), false);
    }
    
    toggleRecording(callback) {
        callback(new Error("Hi, I can't record video"), false);
    }
    
    isRecording() { return false; }
}

exports.newInstance = () => { return new MyCustomCamera(); }

exports.getInterface = () => {
    return {
        id: "mycamera", 
        name: "My Camera", 
        description: "No-op demo custom camera interface"
    };
}

