import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    content: String,
    likes: { type: Number, default: 0 },
    comments: [{
      text: String,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  
      createdAt: Date
    }]
  });
  const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

export default  Comment;