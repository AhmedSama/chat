const {Schema,model} = require("mongoose")
const mongoose = require("mongoose")

const RoomSchema = new Schema({
    name: String,
    type: String,
    users_info : {},
    users: [String],
    last_message: String

}
,
{
    timestamps : true
}
)

module.exports = model("Room",RoomSchema)