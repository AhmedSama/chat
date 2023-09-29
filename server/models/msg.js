const {Schema,model} = require("mongoose")


const MsgSchema = new Schema({
    content: String,
    type : { type: String, default: 'text' } , //it can be text, image, audio and file 
    sender_id: String,
    room_id: String,
}
,
{
    timestamps : true
}
)

module.exports = model("Msg",MsgSchema)