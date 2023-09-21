import { useSelector } from "react-redux";

  
  const Message = ({ text, author }) => {
    const userData = useSelector(state => state.user.userData)
    return (
      <div className={`message ${author === userData.id ? 'user-message' : 'other-message'}`}>
        <p>{text}</p>
      </div>
    );
  };

  export default Message