
import mongoose, { Document, Schema } from "mongoose";
import { IComment } from "./Comments.model";
import { IUser } from "./User.model";

export interface IPost extends Document {
  user: mongoose.Types.ObjectId;
  body: string;
  image?: string;
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema<IPost>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    body: {
      type: String,
      default: "",
    },
    image: {
      type: String,
    },
    likes: {
      type: [{ type: mongoose.Types.ObjectId, ref: "User" }],
      default: [],
    },
    comments: {
      type: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model<IPost>("Post", PostSchema);
export default Post;

// Post.deleteMany({}).then(() => {
//   console.log("Posts deleted");
// });
