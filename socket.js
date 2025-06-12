import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './lib/db.js';

import commentsCounts from './model/commentsCounts.js';
import Like from './model/likes.js';

const app = express();
app.use(cors());
app.use(express.json());
connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://boosters-sooty.vercel.app',
    methods: ['GET', 'POST'],
  },
});

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Boosters Socket.IO Server</h1>');
});

// ✅ GET all comments for a post
app.get('/comments/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await commentsCounts.find({ postId }).sort({ createdAt: -1 }).lean();
    res.status(200).json(comments);
  } catch {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// ✅ GET comment count for a post
app.get('/comment-count/:postId', async (req, res) => {
  try {
    const count = await commentsCounts.countDocuments({ postId: req.params.postId });
    res.status(200).json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to count comments' });
  }
});

// ✅ POST a new comment
app.post('/comment', async (req, res) => {
  try {
    const { postId, comment, userId, userName } = req.body;
    const newComment = new commentsCounts({ postId, comment, userId, userName });
    await newComment.save();
    res.status(201).json(newComment);
    io.emit('post-commented', newComment);
  } catch {
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

// ✅ GET like count for a post
app.get('/like-count/:postId', async (req, res) => {
  try {
    const count = await Like.countDocuments({ postId: req.params.postId });
    res.status(200).json({ count });
  } catch {
    res.status(500).json({ error: 'Failed to count likes' });
  }
});

// ✅ POST or TOGGLE like
app.post('/like', async (req, res) => {
  try {
    const { postId, userId } = req.body;
    const existing = await Like.findOne({ postId, userId });
    if (existing) {
      await existing.deleteOne();
      io.emit('post-unliked', { postId, userId });
      return res.status(200).json({ liked: false });
    } else {
      const newLike = new Like({ postId, userId });
      await newLike.save();
      io.emit('post-liked', newLike);
      return res.status(201).json({ liked: true });
    }
  } catch {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// ✅ SOCKET.IO
io.on('connection', (socket) => {
  // console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    // console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(22628, () => {
  // console.log('Server is running on port 22628');
});
