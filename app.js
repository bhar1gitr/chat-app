const express = require('express');
const dotenv = require('dotenv')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const { v4: uuidv4 } = require("uuid");
const AccessToken = require("twilio").jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server);

// Middlewares
app.use(cors({credentials: true,origin:[ 'http://localhost:3000'] }));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
dotenv.config({path:'./config/config.env'})
app.use(cookieParser())

// Importing DB Connection and Connecting to MongoDB
const conn = require('./conn/db.js')
conn();

// create the twilioClient
const twilioClient = require("twilio")(
    process.env.TWILIO_API_KEY_SID,
    process.env.TWILIO_API_KEY_SECRET,
    { accountSid: process.env.TWILIO_ACCOUNT_SID }
  );

const findOrCreateRoom = async (roomName) => {
    try {
      // see if the room exists already. If it doesn't, this will throw
      // error 20404.
      await twilioClient.video.rooms(roomName).fetch();
    } catch (error) {
      // the room was not found, so create it
      if (error.code == 20404) {
        await twilioClient.video.rooms.create({
          uniqueName: roomName,
          type: "go",
        });
      } else {
        // let other errors bubble up
        throw error;
      }
    }
  };
  
const getAccessToken = (roomName) => {
    // create an access token
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY_SID,
      process.env.TWILIO_API_KEY_SECRET,
      // generate a random unique identity for this participant
      { identity: uuidv4() }
    );
    // create a video grant for this specific room
    const videoGrant = new VideoGrant({
      room: roomName,
    });
  
    // add the video grant
    token.addGrant(videoGrant);
    // serialize the token and return it
    return token.toJwt();
  };

  app.post("/join-room", async (req, res) => {
    // return 400 if the request has an empty body or no roomName
    if (!req.body || !req.body.roomName) {
      return res.status(400).send("Must include roomName argument.");
    }
    const roomName = req.body.roomName;
    // find or create a room with the given roomName
    findOrCreateRoom(roomName);
    // generate an Access Token for a participant in this room
    const token = getAccessToken(roomName);
    res.send({
      token: token,
    });
  });

// User Routes v1
app.use('/api/v1',require('./routes/paymentRoute.js'));
app.use('/api/v1',require('./routes/emailVerifyRoute.js'));
app.use('/api/v1',require('./routes/userRoute.js'));

// Admin Routes v1
app.use('/api/v1',require('./routes/adminRoutes'));
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('message', (message) => {
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(process.env.PORT, () => {
    console.log(`Server is listening on port ${process.env.PORT}`);
})
