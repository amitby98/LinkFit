import mongoose from "mongoose";


export interface IPost extends Document {
    user: mongoose.Schema.Types.ObjectId | IUser;
    title: string;
    body: string;
    image: string;
    likes: number;
    comments: mongoose.Schema.Types.ObjectId[] | IComment[];
    
    createdAt: Date;
    updatedAt: Date;
}