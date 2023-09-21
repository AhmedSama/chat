import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/chat" element={<Chat />}/>
      <Route path="/chat/:otherUserID" element={<Chat />}/>
    </Routes>
  );
}

export default App;
