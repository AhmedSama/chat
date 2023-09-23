const {Schema,model} = require("mongoose")

const RoomSchema = new Schema({
    name: String,
    type: String,
    users_info : {},
    users: [String],
    last_message: String,
    last_message_seen_by : [String]
}
,
{
    timestamps : true
}
)

module.exports = model("Room",RoomSchema)