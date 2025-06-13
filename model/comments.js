import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Posts' },
  content: String,
  likes: { type: Number, default: 0 },
  comment: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  createdAt: { type: Date, default: Date.now }
  
});

const Post = mongoose.models.comments || mongoose.model('comments', PostSchema);
export default Post;
