"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const enums_1 = require("../../common/enums");
const userSchema = new mongoose_1.default.Schema({
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
        required: function () {
            return this.provider === enums_1.ProviderEnum.System;
        },
        select: false,
    },
    gender: { type: Number, default: enums_1.GenderEnum.Male },
    role: { type: Number, default: enums_1.RoleEnum.User },
    provider: { type: Number, default: enums_1.ProviderEnum.System },
    confirmEmail: {
        type: Boolean,
        default: false,
    },
}, {
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
});
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
const UserModel = mongoose_1.default.model("User", userSchema);
exports.default = UserModel;
