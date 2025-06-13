import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './lib/db.js';
import Post from './model/comments.js';
import Comment from './model/commentsCounts.js';
import Like from './model/likes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://boosters-sooty.vercel.app',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

connectDB();

// ✅ Welcome route
app.get('/', (req, res) => {
  res.send('<h1>Boosters Socket.IO Server is Live</h1>');
});

app.get('/post/:postId/details', async (req, res) => {
  try {
    const postId = mongoose.Types.ObjectId(req.params.postId);

    const post = await Post.findById(postId)
      .populate('User_id', 'fullName email avatar')
      .lean();

    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comments = await Comment.find({ postId }).sort({ createdAt: -1 }).lean();
    const likeCount = await Like.countDocuments({ postId });

    res.status(200).json({
      post,
      comments,
      likeCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch post details' });
  }
});
app.get('/comment-count/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const count = await Comment.countDocuments({ postId });
    res.status(200).json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comment count' });
  }
});

app.post('/comment', async (req, res) => {
  try {
    const { postId, comment, userId, userName } = req.body;
    const newComment = new Comment({
      postId,
      content: comment,
      userId,
      userName,
    });
    await newComment.save();
    io.emit('post-commented', newComment);
    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

app.get('/like-count/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const count = await Like.countDocuments({ postId });
    res.status(200).json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch like count' });
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 22628;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
