import React,{ useEffect,useState } from "react";
import './App.css';
import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:4000', { transports: ['websocket']});

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages([...messages, message]);
    });
  }, [messages]);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const sendMessage = () => {
    socket.emit('message', message);
    setMessage('');
  };
  return (
    <>
   <div className="chat-container">
      <div className="message-container">
        {messages.map((message, index) => (
          <div key={index} className="message">
            {message}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={handleMessageChange}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
    </>
  );
}
export default App;
