import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import TransferPage from './components/TransferPage';

function Home() {
  const navigate = useNavigate();

  const generateRoomId = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  const handleCreateRoom = () => {
    const id = generateRoomId();
    navigate(`/${id}`);
  };

  return (
    <div className="home">
      <h1>Local AirDrop</h1>
      <p>Transfer files across any OS on the same WiFi</p>
      <button onClick={handleCreateRoom}>Create New Room</button>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:roomId" element={<TransferPage />} />
      </Routes>
    </Router>
  );
}

export default App;