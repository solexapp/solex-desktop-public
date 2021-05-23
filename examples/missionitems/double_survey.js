'use strict';

const mission_types = req("lib/mission/mission_types.js");
const MathUtils = req("lib/util/MathUtils");

const {
    ComplexMissionItem,
    FieldType,
    Unit,
} = mission_types;

const {
    CameraTrigger,
    YawCondition
} = req("lib/mission/ext/base_types");

const GridTools = req("lib/util/GridTools");
const { GridBuilder, Polygon } = GridTools;
const camdefs = req("lib/camera/camera_defs");
const { CameraDetail } = camdefs;
const { SurveyDetail } = req("lib/mission/ext/survey_detail");

function d(str) { req("lib/util/ConsoleLog").d(require("path").basename(__filename, ".js"), str); }
function e(str) { req("lib/util/ConsoleLog").e(require("path").basename(__filename, ".js"), str); }
function t(str) { req("lib/util/ConsoleLog").t(require("path").basename(__filename, ".js"), str); }

const DEF_OVERLAP = 50;
const DEF_SIDELAP = 60;

function clampAngle(main, input) {
    let output = main + input;
    if(output >= 360) {
        output -= 360;
    }
    return output;
}

function getCameraDefs() {
    const out = [];

    camdefs.getCameraDefs().forEach((def) => {
        out.push({
            id: def.Name,
            name: def.Name
        });
    });

    return out;
}

// This controls what appears in the property sheet for a mission item in the UI.
const MissionItemType = Object.freeze({
    DOUBLE_SURVEY: {
        id: "double_survey", name: "Double Survey",
        is_spatial: true,
        icon_class: "survey",
        sub_marker_class: "pin",
        input_points_type: "polygon",
        fields: [
            { id: "angle", name: "Angle", type: FieldType.NUMBER, range_min: 0, range_max: 359, unit: Unit.ANGLE, get: (item) => item.angle || 0, set: (item, value) => { item.angle = parseFloat(value) } },
            { id: "subAngle", name: "Sub angle", type: FieldType.NUMBER, range_min: 0, range_max: 359, unit: Unit.ANGLE, get: (item) => item.subAngle || 0, set: (item, value) => { item.subAngle = parseFloat(value) } },
            { id: "overlap", name: "Overlap", type: FieldType.NUMBER, range_min: 0, range_max: 359, get: (item) => item.overlap || DEF_OVERLAP, set: (item, value) => { item.overlap = parseFloat(value) } },
            { id: "sidelap", name: "Sidelap", type: FieldType.NUMBER, range_min: 0, range_max: 359, get: (item) => item.sidelap || DEF_SIDELAP, set: (item, value) => { item.sidelap = parseFloat(value) } },
            { id: "lockOrientation", name: "Lock orientation", type: FieldType.BOOLEAN, get: (item) => item.lockOrientation || false, set: (item, value) => { item.lockOrientation = (value) ? true : false } },
            { id: "autoStart", name: "Auto start", type: FieldType.BOOLEAN, get: (item) => item.autoStart || false, set: (item, value) => { item.autoStart = (value) ? true : false } },
            { id: "lockYaw", name: "Lock Yaw", type: FieldType.BOOLEAN, get: (item) => item.lockYaw || false, set: (item, value) => { item.lockYaw = (value) ? true : false } },
            { id: "lockYawAngle", name: "Lock Yaw Angle", type: FieldType.NUMBER, range_min: 0, range_max: 359, unit: Unit.ANGLE, get: (item) => item.lockYawAngle || 0, set: (item, value) => { item.lockYawAngle = parseFloat(value) } },
            { id: "reverse", name: "Reverse", type: FieldType.BOOLEAN, get: (item) => item.reverse || 0, set: (item, value) => { item.reverse = value ? true : false } },
            {
                id: "camera", name: "Camera", type: FieldType.ENUM,
                values: getCameraDefs(),
                get: (item) => item.getCamera(),
                set: (item, value) => { item.setCamera(value); }
            },
        ],
        newItem: () => new DoubleSurvey()
    }
});

class DoubleSurvey extends ComplexMissionItem {
    constructor() {
        super(MissionItemType.DOUBLE_SURVEY)
        this.angle = 0;
        this.subAngle = 20;
        this.overlap = 50;
        this.sidelap = 50;
        this.lockOrientation = false;
        this.autoStart = true;
        this.camera = { id: "none", name: "None" };
        this.camDetail = null;
        this.surveyDetail = null;
        this.lockYaw = false;
        this.lockYawAngle = 0;
        this.reverse = false;
    }

    serialize() {
        return Object.assign({
            location: this.location,
            angle: this.angle,
            subAngle: this.subAngle,
            overlap: this.overlap,
            sidelap: this.sidelap,
            lockOrientation: this.lockOrientation,
            autoStart: this.autoStart,
            lockYaw: this.lockYaw,
            lockYawAngle: this.lockYawAngle,
            camera: this.camera,
            reverse: this.reverse
        }, super.serialize());
    }

    hydrate(input) {
        super.hydrate(input);

        this.location = input.location;
        this.angle = input.angle;
        this.subAngle = input.subAngle;
        this.overlap = input.overlap;
        this.sidelap = input.sidelap;
        this.lockOrientation = input.lockOrientation;
        this.autoStart = input.autoStart;
        this.lockYaw = input.lockYaw;
        this.lockYawAngle = input.lockYawAngle;
        this.camera = input.camera;
        this.reverse = input.reverse;

        const camera = camdefs.findCameraDefById(input.camera.id);
        if (camera) {
            this.camDetail = camdefs.toCameraDetail(camera);
            this.surveyDetail = new SurveyDetail(this.camDetail);
        } else {
            this.camDetail = null;
            this.surveyDetail = null;
        }

        return this;
    }

    getCamera() { return this.camera; }
    setCamera(camId) {
        this.camera = { id: camId, name: camId };
        const camera = camdefs.findCameraDefById(camId);

        if (camera) {
            this.camDetail = camdefs.toCameraDetail(camera);
            this.surveyDetail = new SurveyDetail(this.camDetail);
            this.overlap = this.surveyDetail.getOverlap();
            this.sidelap = this.surveyDetail.getSidelap();
        } else {
            this.camDetail = null;
            this.surveyDetail = null;
            this.overlap = 50;
            this.sidelap = 50;
        }

        return this;
    }

    getLateralPictureDistance() {
        const detail = this.surveyDetail;
        if (detail && detail.setAltitude && detail.getLateralPictureDistance) {
            detail
                .setAltitude(this.location.alt)
                .setAngle(this.angle)
                .setOverlap(this.overlap)
                .setSidelap(this.sidelap);
            return detail.getLateralPictureDistance();
        }

        return 10;
    }

    getLongitudinalPictureDistance() {
        const detail = this.surveyDetail;
        if (detail && detail.setAltitude && detail.getLongitudinalPictureDistance) {
            detail
                .setAltitude(this.location.alt)
                .setAngle(this.angle)
                .setOverlap(this.overlap)
                .setSidelap(this.sidelap);
            return detail.getLongitudinalPictureDistance();
        }
        return 6;
    }

    fields() { return super.fields().concat(this.type.fields); }

    // private
    toMissionItem(pt) {
        const msg = super.baseMissionItem(mavlink.MAV_CMD_NAV_WAYPOINT);
        msg.x = pt.lat;
        msg.y = pt.lng;
        msg.z = this.getAltitude();
        return msg;
    }

    toMissionItems() {
        const path = this.getPath();
        const items = [];

        new CameraTrigger(0).toMissionItems().forEach((item) => items.push(item));

        const picDistance = this.getLongitudinalPictureDistance();
        const surveyAngle = this.angle;
        let reverseAngle = surveyAngle + 180;
        if (reverseAngle >= 360) reverseAngle -= 360;

        path.forEach((p) => {
            items.push(this.toMissionItem(p));

            if (this.autoStart) {
                const next = path[path.indexOf(p) + 1];
                if (next) {
                    const runAngle = MathUtils.getHeadingFromCoordinates(p, next);

                    if (Math.abs(surveyAngle - runAngle) < 0.5 || Math.abs(reverseAngle - runAngle) < 0.5) {
                        new CameraTrigger(picDistance).toMissionItems().forEach(item => items.push(item));
                    }
                }
            }

            if (this.lockOrientation) {
                const yaw = new YawCondition().setAngle(this.angle);
                yaw.toMissionItems().forEach((item) => items.push(item));
            } else if (this.lockYaw) {
                const yaw = new YawCondition().setAngle(this.lockYawAngle);
                yaw.toMissionItems().forEach((item) => items.push(item));
            }
        });

        if (this.autoStart) {
            new CameraTrigger(0).toMissionItems().forEach((item) => items.push(item));
        }

        return items;
    }

    getPath(prevLocation) {
        // e(`getPath(): this.polygonInfo.points.length=${this.polygonInfo.points.length}`);

        const path = [];

        const subAngle = clampAngle(this.angle, this.subAngle);
        [this.angle, subAngle].forEach((angle) => {
            const poly = new Polygon().addPoints(this.polygonInfo.points);
            const options = {
                angle: angle || 0,
                wpDistance: this.getLongitudinalPictureDistance(),
                lineDistance: this.getLateralPictureDistance()
            };

            const gridBuilder = new GridBuilder(poly, options);
            const grid = gridBuilder.generateGrid(false);

            // Probably useful to report this somewhere.
            // const totalDistance = grid.getLength();
            // const lineCount = grid.getNumberOfLines();

            const altitude = this.getAltitude();
            // const points = grid.getCameraLocations();
            const points = grid.gridPoints;
            points.forEach((point) => {
                point.alt = altitude;
                path.push(point);
            });
        });

        if (this.reverse) {
            path.reverse();
        }

        return path;
    }
}

exports.getMissionItemTypes = () => {
    return [MissionItemType.DOUBLE_SURVEY];
}

exports.getMissionItemClasses = () => {
    return [DoubleSurvey];
}

exports.DoubleSurvey = DoubleSurvey;
exports.CameraDetail = CameraDetail;
exports.SurveyDetail = SurveyDetail;

exports.findItemForMessage = (msg) => {
    return null; // todo
}

exports.findItemTypeById = (id) => {
    for (let prop in MissionItemType) {
        const t = MissionItemType[prop];
        if (t.id == id) return t;
    }

    return null;
};
