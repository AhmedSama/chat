import { useEffect, useRef } from "react";
import Message from "../components/Message"

const MessageList = ({ messages }) => {
 const messageListRef = useRef();
    // TODO un comment this useEffect instead of the one bellow when i add "messages" state to the app
    // useEffect(() => {
    //     // Scroll to the last message when messages change
    //     messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    //   }, [messages]);
    useEffect(() => {
        // Scroll to the last message when messages change
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }, []);
    return (
      <div className="message-list" ref={messageListRef} >
        {messages.map((message, index) => (
          <Message
            key={index}
            text={message.content}
            author={message.sender_id}
          />
        ))}
      </div>
    );
  };
  export default MessageList