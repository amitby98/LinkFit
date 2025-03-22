import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IProgress {
  completedDays: number;
}

export interface IBadge {
  level: number;
  name: string;
  icon: string;
  achievedAt: Date;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  profilePicture?: string;
  bio?: string;
  authProvider?: string;
  badges: IBadge[];
  progress?: IProgress;
  comparePassword(password: string): Promise<boolean>;
}

const ProgressSchema: Schema = new Schema<IProgress>(
  {
    completedDays: { type: Number, default: 0 },
  },
  { _id: false }
);

const BadgeSchema: Schema = new Schema<IBadge>(
  {
    level: { type: Number, required: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    achievedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema: Schema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function (this: any): boolean {
        return this.authProvider !== "google";
      },
      select: false,
    },
    profilePicture: {
      type: String,
      default: "/avatar.webp",
    },
    bio: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    badges: {
      type: [BadgeSchema],
      default: [],
    },
    progress: {
      type: ProgressSchema,
      default: { completedDays: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Method to compare passwords
UserSchema.methods.comparePassword = function (plainPassword: string): boolean {
  return bcrypt.compareSync(plainPassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
