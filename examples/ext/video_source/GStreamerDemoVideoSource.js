'use strict';

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ConsoleLog = req("lib/util/ConsoleLog");
const { VideoSource } = req("app/video/VideoSource");

const TAG = path.basename(__filename, ".js");
const VERBOSE = false;
const d = (str) => ConsoleLog.d(TAG, str);
const e = (str) => ConsoleLog.e(TAG, str);
const t = (str) => { if (VERBOSE) e(str); }

class GStreamerDemoVideoSource extends VideoSource {
    constructor() {
        super();
        this.childProcess = null;
    }

    start(callback) {
        super.start(callback);

        this.pingServer();
        this.startChildProcess();
    }

    stop() {
        super.stop();

        if (this.childProcess) {
            try {
                this.childProcess.kill("SIGINT");
            } catch (ex) {
                e(`Error stopping child processs: ${ex.message}`);
            } finally {
                this.childProcess = null;
            }
        }
    }

    isRunning() { return (this.childProcess != null); }

    // "private" methods
    pingServer() {
        const config = this.config;
        if (config.ping_udp && config.ip) {
            const dgram = require("dgram");
            const sock = dgram.createSocket('udp4');
            sock.bind(config.port);
            sock.on("message", (msg, rinfo) => {
                sock.close();
            }).on("error", (err) => {
                e(`err=${err.message}`);
            }).on("close", () => {
                d(`socket closed`);
            });

            const msg = "hi";
            const portNum = config.port;
            const address = config.ip;
            sock.send(msg, 0, msg.length, portNum, address, (err, bytes) => {
                if (err) {
                    return e(`Error sending message: ${err.message}`);
                }

                d(`${bytes} bytes sent to ${address}:${portNum}`);
            });
        }
    }

    startChildProcess() {
        const config = this.config;
        if (!config) return e(`ERROR: No config!`);

        let cmd = config.cmd || `gst-launch-1.0 udpsrc port=${config.port} ! application/x-rtp, media=video, clock-rate=90000, encoding-name=H264, payload=96 ! rtph264depay ! avdec_h264 ! avenc_mpeg1video bitrate=${config.bitrate} ! mpegtsmux ! fdsink`;

        cmd = cmd.replaceAll("${CONFIG.ip}", config.ip);
        cmd = cmd.replaceAll("${CONFIG.port}", config.port);
        cmd = cmd.replaceAll("${CONFIG.bitrate}", config.bitrate || "8000000");

        const params = cmd.split(" ");

        if (params.length < 2) {
            return e(`Invalid command: ${cmd}`);
        }

        this.childProcess = spawn(params.shift(), params);
        t(`started process: child.pid=${this.childProcess.pid}`);

        const self = this;
        this.childProcess.on('error', function (ex) {
            e(ex.message);
        }).on('close', function (code) {
            t(`Child process ended with code ${code}`);
            self.childProcess = null;
        });

        this.childProcess.stdout.on("data", this.sendData.bind(this));
        this.childProcess.stderr.on('data', function (buffer) {
            e(`stderr=${buffer.toString()}`);
        });
    }
}

exports.getType = () => {
    return {
        id: "gstreamer_demo",
        name: "GStreamer demo",
        description: "Stream via external programs such as gstreamer.\nFor the default command, gst-launch-1.0 must be in the system PATH.",
        fields: [
            { id: "cmd", name: "Command (optional)", type: "text", title: "Gstreamer or FFMpeg command to use" },
            { id: "ip", name: "IP address", type: "text", title: "IP address of the video source" },
            { id: "port", name: "Port", type: "number", title: "Port number of the video source" },
            { id: "bitrate", name: "Bitrate", type: "number", default: "8000000", title: "Bitrate to use. 8000000 is a good value to start with." },
            { id: "ping_udp", name: "Ping UDP before start", type: "checkbox", title: "Ping the specified IP when connecting" }
        ]
    }
}

exports.newInstance = () => new GStreamerDemoVideoSource();
