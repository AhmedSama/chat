import MessageList from "./MessageList"
import { useState } from "react";
import { useSelector } from "react-redux";

const Right = ({messages,otherUserID,socket,roomID}) => {
  const [message, setMessage] = useState('');
  const userData = useSelector(state => state.user.userData)
  function sendMessage(){
    if(message.length <= 0){
      return
    }
    const myID = userData.id
    const name = userData.displayName
    const photoURL = userData.photoURL
    socket.emit("send msg",message,roomID,myID,name,photoURL)
    setMessage("")
  }
  return (
    <div className="right">
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
                  <button onClick={sendMessage}>Send</button>
              </div>
          </div>
        }
    </div>
  )
}

export default Right