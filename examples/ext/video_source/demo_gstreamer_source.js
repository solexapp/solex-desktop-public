'use strict';

const { ChildProcess, spawn } = require("child_process");

const ConsoleLog = req("lib/util/ConsoleLog")
const TAG = require("path").basename(__filename, ".js")
function d(str) { ConsoleLog.d(TAG, str); }
function e(str) { ConsoleLog.e(TAG, str); }
function t(str) { ConsoleLog.t(TAG, str); }

let mCallback = null;
let mChildProcess = null;

// connection stats
let mLastPacketTime = 0;
let mLastTotalBytes = 0;
const CHECK_TIME = 5000;

const CONFIG = {
    ip: null,
    port: 0,
    cmd: null
};

exports.setConfig = (config) => {
    Object.assign(CONFIG, config);
    e(`setConfig(): ${JSON.stringify(CONFIG)}`);
}

exports.getType = () => {
    return {
        id: "demofd", 
        name: "Gstreamer external stream",
        description: "Stream via external programs such as gstreamer.\nFor the default command, gst-launch-1.0 must be in the system PATH.",
        fields: [
            { id: "cmd", name: "Command (optional)", type: "text" },
            { id: "ip", name: "IP address", type: "text" },
            { id: "port", name: "Port", type: "number" },
            { id: "ping_udp", name: "Ping UDP before start", type: "checkbox" }
        ]
    }
}

exports.start = (callback) => {
    e(`start()`);
    mCallback = callback;

    if(mChildProcess) {
        return e(`Child process is already running`);
    }

    if(CONFIG.ping_udp && CONFIG.ip) {
        const dgram = require("dgram");
        const sock = dgram.createSocket('udp4');
        sock.bind(CONFIG.port);
        sock.on("message", (msg, rinfo) => {
            sock.close();
        }).on("error", (err) => {
            e(`err=${err.message}`);
        }).on("close", () => {
            d(`socket closed`);
        });

        const msg = "hi";
        const portNum = CONFIG.port;
        const address = CONFIG.ip;
        sock.send(msg, 0, msg.length, portNum, address, (err, bytes) => {
            if (err) {
                return e(`Error sending message: ${err.message}`);
            }

            d(`${bytes} sent to ${address}:${portNum}`);
        }); 
    }

    let cmd = CONFIG.cmd || `gst-launch-1.0 udpsrc port=${CONFIG.port} ! application/x-rtp, media=video, clock-rate=90000, encoding-name=H264, payload=96 ! rtph264depay ! avdec_h264 ! avenc_mpeg1video bitrate=100000 ! mpegtsmux ! fdsink`;

    cmd = cmd.replaceAll("${CONFIG.ip}", CONFIG.ip);
    cmd = cmd.replaceAll("${CONFIG.port}", CONFIG.port);

    const params = cmd.split(" ");

    if(params.length < 2) {
        e(`Invalid command: ${cmd}`);
    }

    mChildProcess = spawn(params.shift(), params);
    e(`child=${mChildProcess}`);

    mChildProcess.on('error', function(ex) {
        e(ex.message);
    }).on('close', function(code) {
        e(`Child process ended with ${code}`);
        mChildProcess = null;
    });

    mChildProcess.stdout.on('data', function(buffer) {
        const now = Date.now();
        mLastTotalBytes += buffer.length;

        if ((now - mLastPacketTime) >= CHECK_TIME) {
            const kbs = (mLastTotalBytes / 1024).toFixed(1);
            const mbps = ((8 * kbs) / CHECK_TIME).toFixed(1);
            mLastTotalBytes = 0;
            mLastPacketTime = now;
        }

        if (mCallback && mCallback.onData) {
            mCallback.onData(buffer);
        }
    });

    mChildProcess.stderr.on('data', function(buffer) {
        e(`stderr=${buffer.toString()}`);
    });
}

exports.stop = () => {
    e(`stop()`);

    if(mChildProcess) {
        try {
            mChildProcess.kill('SIGINT');
        } catch(ex) {
            e(`Error stopping child process: ${ex.message}`);
        } finally {
            mChildProcess = null;
            mCallback = null;
        }
    }
}

exports.isRunning = () => {
    return (mChildProcess != null);
}
