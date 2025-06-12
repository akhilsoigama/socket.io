import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  User_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Post || mongoose.model("Post", PostSchema);

