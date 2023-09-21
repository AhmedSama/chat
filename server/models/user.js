const {Schema,model} = require("mongoose")


const UserSchema = new Schema({
  id : String,
  username: String,
  email: String,
  photoURL: String
},
{
    timestamps : true
}
)

module.exports = model("User",UserSchema)