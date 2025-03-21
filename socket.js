import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './lib/db.js';
import Comment from './model/comments.js';

const app = express();
app.use(cors());

connectDB();
console.log("hello world")

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Socket.IO Server 🚀</h1>');
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'https://boosters-sooty.vercel.app',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.emit('server-message', `✅ User connected: ${socket.id}`);

  socket.on('like-post', (data) => {
    io.emit('post-liked', data);
    socket.emit('server-message', ' Post liked .');
  });

  socket.on('comment-post', async (data) => {
    const { postId, comment, userId } = data;
    try {
      const post = await Comment.findById(postId);
      if (post) {
        post.comments.push({
          text: comment,
          userId,
          createdAt: new Date()
        });
        await post.save();

        io.emit('post-commented', {
          postId,
          comment,
          userId
        });
        socket.emit('server-message', 'Comment added.');
      } else {
        socket.emit('server-message', 'Post not found.');
      }
    } catch (err) {
      socket.emit('server-message', ' Error commenting on post.');
    }
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('server-message', ` User disconnected: ${socket.id}`);
  });
});

server.listen(22628, () => {
  console.log('🚀 Socket.io server running on port 22628');
});
