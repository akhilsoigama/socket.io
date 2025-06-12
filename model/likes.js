import mongoose from "mongoose";

const LikeSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  });
  
  const Like =  mongoose.models.Like || mongoose.model("Like", LikeSchema);
  export default Like