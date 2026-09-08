import mongoose from "mongoose";
import { IUser } from "../../common/interfaces";
import { GenderEnum, RoleEnum, ProviderEnum } from "../../common/enums";

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    profilePic: { type: String },
    profilePicPublicId: { type: String },
    profileCoverPic: { type: [String] },
    profileCoverPicPublicIds: { type: [String] },
    password: {
      type: String,
      required: function (this) {
        return this.provider === ProviderEnum.System;
      },
      select: false,
    },
    gender: { type: Number, default: GenderEnum.Male },
    role: { type: Number, default: RoleEnum.User },
    provider: { type: Number, default: ProviderEnum.System },
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    tokenVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  },
);

userSchema
  .virtual("userName")
  .set(function (value) {
    let [firstName, lastName] = value.split(" ");
    this.firstName = firstName;
    this.lastName = lastName;
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

const UserModel = mongoose.model<IUser>("User", userSchema);

export default UserModel;
