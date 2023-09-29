import { useSelector } from "react-redux";

  
  const Message = ({type, text, author }) => {
    const userData = useSelector(state => state.user.userData)
    return (
      <div className={`message ${author === userData.id ? 'user-message' : 'other-message'}`}>
        {
          type === undefined || type === "text" && <p>{text}</p>
        }
        {
           type === "image" && <img width={300} src={text} alt={text} />
        }
      </div>
    );
  };

  export default Message