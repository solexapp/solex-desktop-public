'use strict';

const mission_types = req("lib/mission/mission_types");
const MathUtils = req("lib/util/MathUtils");

const { VehicleType, SpatialMissionItem, FieldType, Unit } = mission_types;

const MIN_RADIUS = 6;
const MAX_RADIUS = 200;

const MissionItemType = Object.freeze({
    ORBIT: { 
        id: "orbit", name: "Orbit", 
        is_spatial: true,
        icon_class: "circle",
        vehicle_types: [VehicleType.COPTER],
        fields: [
            { id: "radius", name: "Radius", type: FieldType.RANGE, range_min: MIN_RADIUS, unit: Unit.DISTANCE, range_max: MAX_RADIUS, get: (item) => item.radius || MIN_RADIUS, set: (item, value) => { item.radius = value } },
            { id: "turns", name: "Turns", type: FieldType.NUMBER, get: (item) => item.turns || 1, set: (item, value) => { item.turns = value } },
            { id: "direction", name: "Direction", type: FieldType.ENUM, 
                values: [
                    { id: "cw", name: "Clockwise" },
                    { id: "ccw", name: "Counter clockwise" },
                ],
                get: (item) => item.getDirection() || "cw", set: (item, value) => { item.setDirection(value) } 
            },
        ],
        newItem: () => new OrbitMissionItem() 
    }
});

class OrbitMissionItem extends SpatialMissionItem {
    constructor() {
        super(MissionItemType.ORBIT);
        this.radius = MIN_RADIUS;
        this.turns = 1;
        this.direction = "cw";
    }

    fields() { return super.fields().concat(this.type.fields); }
    
    getDirection() { return this.direction; }
    setDirection(d) { this.direction = d; return this; }
    
    getPath(prevLocation) {
        const path = [];
        const center = this.getLocation();
        let heading = (prevLocation) ? MathUtils.getHeadingFromCoordinates(center, prevLocation) : 0;
        const radius = this.radius || MIN_RADIUS;
        const turns = this.turns || 1;
        
        for(let t = 0; t < turns; ++t) {
            for (let i = heading; i <= (heading + 360); i += 10) {
                const h = (i > 360) ? (i - 360) : i;
                path.push(MathUtils.newCoordFromBearingAndDistance(center, h, radius));
            }
        }
        
        return path;
    }
}

exports.getMissionItemTypes = () => {
    return [MissionItemType.ORBIT];
}

exports.getMissionItemClasses = () => {
    return [OrbitMissionItem];
}

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

