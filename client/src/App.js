import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import TransferPage from './components/TransferPage';

function App() {
  const [roomId, setRoomId] = useState('');

  const generateRoomId = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  return (
    <Router>
      <Route exact path="/">
        <div className="home">
          <button onClick={() => {
            const id = generateRoomId();
            setRoomId(id);
            window.location.href = `/${id}`;
          }}>Create New Room</button>
        </div>
      </Route>
      <Route path="/:roomId">
        <TransferPage roomId={roomId} />
      </Route>
    </Router>
  );
}

export default App;