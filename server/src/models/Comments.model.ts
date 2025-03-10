import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./User.model";
import { IPost } from "./Post.model";

export interface IComment extends Document {
  user: mongoose.Schema.Types.ObjectId | IUser;
  post: mongoose.Schema.Types.ObjectId | IPost;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema<IComment>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Post",
    },
    body: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IComment>("Comment", CommentSchema);
