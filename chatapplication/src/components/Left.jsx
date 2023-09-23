import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import axiosInstance from "../axiosConfig";
import { BiLogOut } from "react-icons/bi";


const Left = ({socket,setRoomID,users,setShowRightSection}) => {
    const userData = useSelector(state => state.user.userData)
    const [searchInput,setSearchInput] = useState('')
    const usersWithLastMessage = users.filter(room => room.last_message !== null);

    const [searchUsers,setSearchUsers] = useState([])
    const navigate = useNavigate()
    useEffect(() => {
        if(!userData) return
        // Create a timer variable to debounce the search
        let timer;
    
        // Function to perform the actual search
        const performSearch = async () => {
          try {
            const response = await axiosInstance.get(`/users?search=${searchInput}&userid=${userData.id}`);
            setSearchUsers(response.data);
          } catch (error) {
            console.error('Error searching for users:', error);
          }
        };
    
        // Debounce the search by delaying it for 2 seconds after the user stops typing
        timer = setTimeout(() => {
          if (searchInput.trim() !== '') {
            performSearch();
          }
          else{
            setSearchUsers([])
          }
        }, 500); // Adjust the delay as needed (.5 seconds in this case)
    
        // Clear the timer if the user types again within the delay
        return () => clearTimeout(timer);
      }, [searchInput,userData])

    function logout (){
        signOut(auth).then(() => {
            navigate("/")
          }).catch((error) => {
            // An error happened.
          });
      }
    function makeRoom(otherUserID){
        socket.emit("make room",userData.id,otherUserID)
        setSearchUsers([])
    }

    async function setTheRoom(otherUserID){
      const room = await axiosInstance.get(`/room?my_id=${userData.id}&other_id=${otherUserID}`)
      setRoomID(room.data._id)
    }
    function handleUserClick(user_id){
      setTheRoom(user_id)
      setShowRightSection(true)
    }
  return (
    <div className="left">
      {/* searchbar */}
      <div className="topbar shadow">
        <div className="center">

          <img className="user-img" src={userData.photoURL} alt={userData.displayName} />
        </div>
          <div className="search-input center">
              <input  value={searchInput} onChange={e => setSearchInput(e.target.value)} type="text" placeholder="Search" />
              {
              searchUsers.length > 0 &&
              <div className="result-container">
                  {       
                  searchUsers.map(data => <Link onClick={()=>makeRoom(data.id)} key={data._id} to={"/chat/"+data.id}>
                      <div className="chat-item p" >
                        <div className="center">
                          <img className="user-img" src={data.photoURL} alt={data.username} />
                        </div>
                          <span>{data.username}</span>
                      </div>
                  </Link> 
                      )
                  }
              </div>
              }
          </div>
      </div>
      {/* list of users or rooms */}
        <ul className="user-container">
          {
            usersWithLastMessage?.map(data => {
              return(
                <Link onClick={()=>handleUserClick(data.users_info.user1.id === userData.id ? data.users_info.user2.id : data.users_info.user1.id)}  key={data.name}  to={`/chat/${data.users_info.user1.id === userData.id ? data.users_info.user2.id : data.users_info.user1.id}`}>
                  <li className={`chat-item p ${data.active? "active" : ""}`}>
                    <div>
                      <img className="user-img side" src={data.users_info.user1.id === userData.id ? data.users_info.user2.photoURL : data.users_info.user1.photoURL} alt={"heh"} />
                    </div>
                    <div>
                      <h4>{data.users_info.user1.id === userData.id ? data.users_info.user2.username : data.users_info.user1.username}</h4>
                      <p> {data.last_message}</p>
                    </div>
                  </li>
                </Link>
              )
            })
          }

        </ul>
        <div className="p">
          <BiLogOut title="logout" className="logout-btn" onClick={logout} />
        </div>
    </div>
  )
}

export default Left
