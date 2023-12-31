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
const multer = require('multer');
const path = require("path")

require('dotenv').config();

// environment variables
const port = process.env.PORT || 4000;
const databaseUrl = process.env.DATABASE_URL;

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(cors())
app.use(express.json())

// Define the storage for uploaded images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Specify the directory where uploaded images will be saved
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      // Generate a unique filename for the uploaded image
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
    },
})

const upload = multer({ storage });


const server = http.createServer(app)

const io = new Server(server, {
    cors : {
        origin : "*",
        methods : "*",
    }
})

  async function searchUsersByLetter(letter,myuserid) {
    try {
        // this query search for all users with the letter provided except my user
        const users = await User.find({ username: { $regex: new RegExp(letter, 'i') } , id: { $ne: myuserid } });
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
        // i dont have to check if the user is existed or not because i have that check
        // inside setTheRoomID function inside Chat.jsx in client and /room api in the server
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
            last_message :null,
            last_message_seen_by : []
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
        socket.on("send msg",async (message,roomID,myID,name,photoURL,type) => {
            //console.log("msg recv",message,roomID,myID)
            io.to(roomID).emit("msg recv",message,roomID,myID,name,photoURL,type)
            const room = await Room.findOneAndUpdate(
                { _id: roomID }, // Find the room by _id
                { 
                    $set:{ 
                        last_message: message ,
                        last_message_seen_by: [myID], 
                    },
          
                },
                { new: true }
            )
            console.log("roomy:",room);
            await Msg.create({
                content : message,
                room_id : roomID,
                sender_id : myID,
                type : type,
            })
        })
        // under test
        socket.on("update room",async(roomID,myID)=>{
            const updatedRoom = await Room.findOneAndUpdate(
                { _id: roomID,last_message_seen_by: { $ne: myID }} ,
                {
                  $push: {
                    last_message_seen_by: myID,
                  },
                },
                { new: true } // This option returns the updated document
              );
        })
        socket.on("disconnect",()=>{
            console.log(socket.id,"disconnected");
        })
    });
    app.get("/users",async (req,res) => {
        // add my user id so i don't fetch it with the users
        const users = await searchUsersByLetter(req.query.search,req.query.userid);
        res.json(users)
    })
    app.get("/user",async (req,res) => {
        try{
            const user = await User.findOne({id : req.query.userID});
            res.json(user)
        }
        catch(error){
            res.status(400).json({error})
        }
    })
    app.get("/room",async (req,res) => {
        const room = await joinRoom(req.query.my_id,req.query.other_id)
        res.json(room)
    })
    app.get("/msgs",async (req,res) => {
        const msgs = await Msg.find({room_id : req.query.room_id}).sort({ createdAt: -1 });
        res.json(msgs)
    })
    // Configure the file upload route
    app.post('/upload', upload.single('image'), (req, res) => {
        const image = req.file;
    
        if (!image) {
            return res.status(400).send('No image uploaded.');
        }
    
        // generate the full URL for the saved image
        const imageUrl = `${req.protocol}://${req.get('host')}/${image.path}`;

        res.status(200).json({ message: 'Image uploaded successfully', imageUrl });
    });
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










