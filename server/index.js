const express = require("express")
const app = express()
const http = require("http")
const cors = require("cors")
const {Server} = require("socket.io")
const mongoose = require("mongoose")
const User = require("./models/user")
const { v4: uuid } = require('uuid');
const Room = require("./models/room")
const Msg = require("./models/msg")
require('dotenv').config();

// environment variables
const port = process.env.PORT || 4000;
const databaseUrl = process.env.DATABASE_URL;

app.use(cors())
app.use(express.json())

const server = http.createServer(app)

const io = new Server(server, {
    cors : {
        origin : "*",
        methods : "*",
    }
})

  async function searchUsersByLetter(letter,myuserid) {
    try {
        const users = await User.find({ username: { $regex: new RegExp(letter, 'i') } , id: { $ne: myuserid } });
        // Handle the matching users
        ////console.log(users);
        return users
      } catch (error) {
        console.error('Error searching for users:', error);
      }
  }
  async function joinRoom(userID,otherUserId){
    let room = await Room.findOne({ users: { $all: [userID, otherUserId], $size: 2 } })
    return room
}
async function makeRoom(userID,otherUserId){
    let room = await Room.findOne({ users: { $all: [userID, otherUserId], $size: 2 } })
    if (!room) {
        console.log("room is created",userID,otherUserId);
        // TODO check if the user is really existed
        const user1 = await User.findOne({id : userID})
        const user2 = await User.findOne({id : otherUserId})
        room = await Room.create({
            name : uuid(),
            type : "private",
            users_info : {
                user1,
                user2
            },
            users : [userID,otherUserId],
            last_message :null
        })
        return room
    }
    else{
        console.log("room is already",room);
        return room
    }
}

mongoose.connect(databaseUrl)
.then(() => {
    io.on('connection', async (socket) => {
        console.log(socket.id,"is connected");
        socket.on("join related rooms",async(userID) => {
            // get all rooms that I have my ID in the users array
            const rooms = await Room.find(
                {
                    users: { $elemMatch: { $eq: userID } }
                }
            )
            // join rooms I have my user id in 
            for(let room of rooms){
                socket.join(room.id)
            }
            // send the rooms info back
            socket.emit("get rooms",rooms)
        })

        socket.on("add my id",(myID) => {
            socket.join(myID)
        })
        socket.on("make room",async (myID,OtherID)=>{
            const room = await makeRoom(myID,OtherID)
            io.to(myID).emit("room info",room)
            io.to(OtherID).emit("room info other",room)
        })
        
        socket.on("join by room info",(roomID)=>{
            socket.join(roomID)
        })
        socket.on("send msg",async (message,roomID,myID,name,photoURL) => {
            //console.log("msg recv",message,roomID,myID)
            io.to(roomID).emit("msg recv",message,roomID,myID,name,photoURL)
            await Room.findOneAndUpdate(
                { _id: roomID }, // Find the room by _id
                { $set: { last_message: message } }
            )
            await Msg.create({
                content : message,
                room_id : roomID,
                sender_id : myID
            })
        })

        socket.on("sendmsg",(msg,room)=>{
            io.to(room).emit(msg)
        })
        socket.on("disconnect",()=>{
            console.log(socket.id,"disconnected");
        })
    });
    app.get("/users",async (req,res) => {
        const users = await searchUsersByLetter(req.query.search,req.query.userid);
        res.json(users)
    })
    app.get("/room",async (req,res) => {
        const room = await joinRoom(req.query.my_id,req.query.other_id)
        res.json(room)
    })
    app.get("/msgs",async (req,res) => {
        const msgs = await Msg.find({room_id : req.query.room_id})
        res.json(msgs)
    })
    app.post("/adduser",async (req,res) => {
            User.findOne({ email: req.body.email })
            .then(async (result) => {
                if (!result) {
                    try{
                        const user = await User.create({
                            username : req.body.displayName,
                            email : req.body.email,
                            photoURL : req.body.photoURL,
                            id : req.body.id
                        })
                        res.status(200).json({user})

                    }catch(error){
                        res.status(400).json({error:error})
                    }
                }
                else{
                    res.status(200).json({result})
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                res.status(400).json({error:error})
            }) 
    })
    
    server.listen(port, () => {
        console.log('listening on',port);
    });    
})
.catch((error)=>{
    //console.log(error)
})










