import Message from "../components/Message"

const MessageList = ({ messages }) => {

    return (
      <div className="message-list">
        {messages.map((message, index) => 
          <Message
          key={index}
          text={message.content}
          author={message.sender_id}
          type={message.type}
        />
          
        )
        }
      </div>
    );
  };
  export default MessageList