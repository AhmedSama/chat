import MessageList from "./MessageList"
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { IoSend } from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa";
import { useParams } from "react-router-dom";
import axiosInstance from "../axiosConfig";
import ImageUpload from "./ImageUpload";

const Right = ({messages,socket,roomID,setShowRightSection}) => {
  const [message, setMessage] = useState('');
  const userData = useSelector(state => state.user.userData)
  const [otherUserData,setOtherUserData] = useState(null)
  const {otherUserID} = useParams()
  
  function sendMessage(){
    if(message.length <= 0){
      return
    }
    const myID = userData.id
    const name = userData.displayName
    const photoURL = userData.photoURL
    socket.emit("send msg",message,roomID,myID,name,photoURL,"text")
    setMessage("")
  }
  useEffect(() => {
    const performSearch = async () => {
      try {
        const response = await axiosInstance.get(`/user?userID=${otherUserID}`);
        setOtherUserData(response.data);
        console.log(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    if(otherUserID){
      performSearch()
    }
  },[otherUserID])
  return (
    <div className={`right`}>
      {
        otherUserData &&
        <div className="topbar topbar-right">
          <FaArrowLeft onClick={e=>setShowRightSection(false)} className="topbar-arrow"/>
          <div className="chat-item">
            <div className="center">
              <img src={otherUserData.photoURL} alt={otherUserData.photoURL} className="user-img" />
            </div>
            <div>
            <h3>{otherUserData.username}</h3>
            <p className="light-text">last seen recently</p>

            </div>
          </div>
        </div>
     }
        {/* list of msgs */}
        <MessageList messages={messages} />
        {/* input */}
        {
          otherUserID &&
          <div className="input-section">
              <div className="message-input">
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={message}
                    onChange={e=>setMessage(e.target.value)}
                />
                <IoSend title="send the message" onClick={sendMessage} className="send-btn"/>
                <ImageUpload roomID={roomID} socket={socket}/>
              </div>
          </div>
        }
    </div>
  )
}

export default Right