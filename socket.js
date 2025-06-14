import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './lib/db.js';
import Like from './model/likes.js';
import Comment from './model/commentsCounts.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://boosters-sooty.vercel.app',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
connectDB();

app.get('/', (req, res) => {
  res.send('<h1>Boosters Socket.IO Server is Live</h1>');
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

app.get('/comments/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ comments });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/comment', async (req, res) => {
  try {
    const { postId, comment, userId, userName } = req.body;
    const newComment = new Comment({
      postId,
      content: comment,
      userId,
      userName
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

app.put('/comment/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const updated = await Comment.findByIdAndUpdate(
      commentId,
      { content },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    io.emit('comment-updated', updated);
    res.status(200).json(updated);
  } catch (err) {
    console.error('Failed to update comment:', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

app.delete('/comment/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const deleted = await Comment.findByIdAndDelete(commentId);

    if (!deleted) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    io.emit('comment-deleted', { commentId });
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Failed to delete comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 22628;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
