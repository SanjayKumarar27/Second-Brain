import mongoose, { model,Schema, Types } from "mongoose";

const UserSchema=new Schema({
    username:{type:String,unique:true},
    password:{type:String}
})

export const UserModel=model("Users",UserSchema);

const LinkSchema=new Schema({
    hash:{type:String},
    userid:{type:mongoose.Schema.Types.ObjectId,ref:'Users',required:true}
})

export const LinkModel=model("Links",LinkSchema);

const TagSchema=new Schema({
    title:{type:String}
})

export const TagModel=model("Tags",TagSchema);

const contentType=['image','youtube','tweet','audio']
const ContentSchema=new Schema({
    link:{type:String,required:true},
    type:{type:String,enum:contentType,reuired:true},
    title:{type:String,required:true},
    tags:[{type:Types.ObjectId,ref:'Tags'}],
    userid:{type:Types.ObjectId,ref:'Users',required:true}
})

export const ContentModel=model("Contents",ContentSchema);
