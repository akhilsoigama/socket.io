import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './lib/db.js';

import Post from './model/comments.js';

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'https://boosters-sooty.vercel.app',
    methods: ['GET', 'POST']
  }
});

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Socket.IO Server 🚀</h1>');
});
app.get('/comment', async (req, res) => {
    const posts = await Post.find().select('postId comment userId userName createdAt likes')
    .sort({ createdAt: -1 })
    .lean(); 
    res.status(200).json(posts);
  
});
app.post('/comment', async (req, res) => {
  try {
    const { postId, comment, userId, userName } = req.body;
    const newComment = new Post({
      postId,
      comment,
      userId,
      userName,
      timestamp: new Date()
    });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

io.on('connection', (socket) => {
  socket.emit('server-message', `✅ User connected: ${socket.id}`);
  
  socket.on('like-post', (data) => {
    io.emit('post-liked', data);
    socket.emit('server-message', '✅ Post liked.');
  });
  
  socket.on('comment-post', async (data) => {
    const { postId, comment, userId, userName } = data;
    
    try {
      const newComment = new Post({
        postId,
        comment,
        userId,
        userName,
        timestamp: new Date()
      });
      
      await newComment.save();
      
      io.emit('post-commented', newComment);
      
      socket.emit('server-message', '✅ Comment added successfully');
    } catch (err) {
      console.error('Error:', err);
      socket.emit('server-message', '❌ Error commenting on post.');
    }
  });

  socket.on('disconnect', () => {
    io.emit(`❌ User disconnected: ${socket.id}`);
  });
});

app.get('/comment/:postId', async (req, res) => {
    const { postId } = req.params; 
    
    const comments = await Post.find({ postId })
      .select('comment postId userId userName createdAt likes')
      .sort({ createdAt: -1 })
      .lean();
    
    if (!comments || comments.length === 0) {
      return res.status(404).json({ error: 'No comments found for this post' });
    }

    res.status(200).json(comments);
 
});

server.listen(22628, () => {
  console.log('🚀 Socket.io server running on port 22628');
});