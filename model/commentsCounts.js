import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  });
  
  const commentsCounts =  mongoose.models.Comment || mongoose.model("Commentcount", CommentSchema);

  export default commentsCounts;