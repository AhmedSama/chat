const {Schema,model} = require("mongoose")


const MsgSchema = new Schema({
    content: String,
    sender_id: String,
    room_id: String,
}
,
{
    timestamps : true
}
)

module.exports = model("Msg",MsgSchema)