
export interface IComment extends Document {
    user: mongoose.Schema.Types.ObjectId | IUser;
    post: mongoose.Schema.Types.ObjectId | IPost;
    body: string;
    createdAt: Date;
    updatedAt: Date;
}