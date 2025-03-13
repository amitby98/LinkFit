import mongoose, { Document, Schema } from "mongoose";
import { IComment } from "./Comments.model";
import { IUser } from "./User.model";

export interface IPost extends Document {
  user: mongoose.Schema.Types.ObjectId | IUser;
  body: string;
  image: string;
  likes: mongoose.Schema.Types.ObjectId[] | IUser[];
  comments: mongoose.Schema.Types.ObjectId[] | IComment[];

  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema<IPost>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    body: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    comments: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
      ref: "Comment",
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
