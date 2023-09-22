import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { auth } from "../firebase"
import { Link, useNavigate, useParams } from "react-router-dom"
import { setUserData } from "../slices/userSlice"
import io from 'socket.io-client';
import Right from "../components/Right"
import Left from "../components/Left"
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from "../axiosConfig"
import axios from "axios"

const Chat = () => {
    
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const userData = useSelector(state => state.user.userData)
    // users are just the rooms from the database with last message with it
    const [users,setUsers] = useState([])
    const [roomID,setRoomID] = useState(null)
    const { otherUserID } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    async function setTheRoomID(my_id,otherUserID){
      const room = await axiosInstance.get(`/room?my_id=${my_id}&other_id=${otherUserID}`)
      if(room.data){
        setRoomID(room.data._id)
      }
      else{
        navigate("/chat")
      }
    }

  useEffect(()=>{
    const cancelTokenSource = axios.CancelToken.source();
    async function getAllMsgsByRoomID(){
      if(roomID){
        try{
          const msgs = await axiosInstance.get(`/msgs?room_id=${roomID}`, {
            cancelToken: cancelTokenSource.token
          })
          setMessages([...msgs.data])
        }
        catch(error){
          if (axios.isCancel(error)) {
            // Handle request cancellation here
            console.log(error.message);
          } else {
            console.log("error",error)
          }
        }
      }
    }
    getAllMsgsByRoomID()
    return () => {
      cancelTokenSource.cancel('Request canceled😉');
    };
  }
  // it depends on other user id so when we click on other user we get another messages
  ,[otherUserID,roomID])

  // this the first thing when i get the rooms and add active state to them
  // i set it to obj.users.includes(otherUserID) so if i refresh the page and i was in some chat i will active=true to that chat
  useEffect(() => {
    if (!socket) return
    socket.on("get rooms", rooms=>{
      // add active state to the room data so i can style the active user
      const modifiedArray = rooms.map(obj => {
        return {
          ...obj,
          active: obj.users.includes(otherUserID),
        }
      });

      // sort the room depends on updatedAt to render them from the earliest updated room to last 
      // it updates when a new last_message is updated in the room
      modifiedArray.sort((room1, room2) => {
        const date1 = new Date(room1.updatedAt);
        const date2 = new Date(room2.updatedAt);
        return date2 - date1;
      });
      setUsers(modifiedArray)
    })
    return () => {
      socket.off("get rooms")
    }
  },[socket,otherUserID])

  // set the active state for the user when otherUserID changes
  useEffect(()=>{
    setUsers(prevUsers => {
      return prevUsers.map(obj => ({
        ...obj,
        // i used otherUserID to make it fast because it get is it from the url imediatly
        active: obj.users.includes(otherUserID),
        // we can use this method to update the active state but make sure to inlude the roomID in the dependency array instead of otherUserID
        // active: obj._id === roomID,
      }));
    })
  },[otherUserID])

  useEffect(()=>{
    if(otherUserID && userData){
      setTheRoomID(userData.id,otherUserID)
    }
  },[otherUserID,userData])

  useEffect(() => {
    if(!socket) return

    socket.on("msg recv",(msg,room_id,userID,name,photoURL)=>{
      const now = new Date(); // Get the current date and time
      // Format the date and time into the desired string format with the timezone offset
      const updatedAt_timestamp = now.toISOString().replace('Z', '+00:00');
      // update the users in sidebar spesifically update the last message and update the updatedAt to sort the rooms or users
      // * note that i have to update the updatedAt cause i dont get it immediatlly from database 
      // user._id is the id of the room in side bar
      // room_id is the room id sent with the message
      setUsers((prevUsers) => {
        return prevUsers.map(user=> user._id === room_id ? {...user,last_message : msg,updatedAt:updatedAt_timestamp} : user).sort((room1, room2) => {
          const date1 = new Date(room1.updatedAt);
          const date2 = new Date(room2.updatedAt);
          return date2 - date1;
        });
      })

      // if the id of sender is the otherUserID or my id i have to update the messages
      if(otherUserID === userID || userData.id === userID){
        setMessages((prevMessages) => [...prevMessages, {content:msg,sender_id : userID}]);
      }
      // else it means the msg comes from a user that I am not open his/her chat so just toast it
      else{
        toast((t) => (
          <Link onClick={() => {
            toast.dismiss(t.id)
            
            }} to={`/chat/${userID}`}>
            <span className="user-info">
              <img className="user-image" src={photoURL} alt={name} />
              <div>
                <h4>{name}</h4>
                <p>{msg}</p>
              </div>
            </span>
          </Link>
        ));
      }
    })

    return () => {
      socket.off("msg recv")
    }
  },[socket,otherUserID,userData])
    useEffect(()=>{
      const socketInstance = io(process.env.REACT_APP_SERVER_URL)

        // check if the user is loged in
        auth.onAuthStateChanged(function(user) {
          if (user) {
              
            socketInstance.on('connect', () => {
              console.log("connected");
            });
            // first add my id so i join a room with my id
            socketInstance.emit("add my id",user.uid)

            socketInstance.emit("join related rooms",user.uid)

            // when I click on a user in search it send "make room" event to server with my id and other user id
            // the server create a room and send the room back with two events one for me "room info"
            //  and the other for the other user "room info other"
            socketInstance.on("room info",(roomInfo)=>{
              // add the room to the rooms which are users and also add active state to it 
              setUsers((prevUsers) => {
                return [...prevUsers,{...roomInfo,active:false}]
              })
              // set the room id so i can send msg * when i send a message i have to have the roomid is set
              setRoomID(roomInfo._id)
              // then I send the roomID so both users join the room
              socketInstance.emit("join by room info",roomInfo._id)
            })
            socketInstance.on("room info other",(roomInfo)=>{
              // add the room to the rooms which are users and also add active state to it 
              setUsers((prevUsers) => {
                return [...prevUsers,{...roomInfo,active:false}]
              })
              // then I send the roomID so both users join the room
              socketInstance.emit("join by room info",roomInfo._id)
            })

            // after making the main events of the socket i set it to state so it is not recreated in every re render of the page
            setSocket(socketInstance);

            dispatch(setUserData({
              id : user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL
          }))
          } 
          // if the user is not loged in
          else {
            navigate("/")
          }
        });

        // Clean up the socket connection when the component unmounts
        return () => {
          socketInstance.disconnect();
        };
    },[])

  return (
    <>  {
        userData && socket &&
        <div className="chat" >
            {/* left section */}
            <Left socket={socket} setRoomID={setRoomID} users={users} setUsers={setUsers}/>
            {/* right section */}
            <Right messages={messages} otherUserID={otherUserID} socket={socket} roomID={roomID} />
            <Toaster
            position="top-right"
            reverseOrder={false}
            />
        </div>
      }
    </>
  )
}

export default Chat