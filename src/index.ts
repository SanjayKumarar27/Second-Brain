import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {z} from "zod";
import bcyrpt from "bcrypt";
import { ContentModel, LinkModel, UserModel } from "./db";
import { userMiddleware } from "./middleware";
import { random } from "./utils";


dotenv.config();

const app=express();
app.use(express.json());
const jwtkey=process.env.JWT_TOKEN;
const mongourl=process.env.MONGODB_URL;
async function main() {
    if(!mongourl){
        console.error("MONGODB_URL is  not set")
    }else{
        await mongoose.connect(mongourl);
        console.log('server reached here' + mongourl)
    }
}
main();
app.post("/app/v1/signup",async (req,res)=>{
    try{
    const Usersignup=z.object({
        username:z.string()
        .min(3,"The username is less than 3 character")
        .max(10,"The username is more than 10 charcter"),
        password:z.string()
            .min(8,"The password should be of leangth minimum 8 charactors")
            .max(20,"The password should be of leangth maximum 20 charactors")
            .refine((val)=> /[A-Z]/.test(val),{
                message:"The password Must have one upper chase letter"
            })
            .refine((val)=> /[a-z]/.test(val),{
                message:"The password must have one lower case letter",
            })
            .refine((val)=> /[0-9]/.test(val),{
                message:"The password must have one number",
            })
            .refine((val)=> /[^A-Za-z0-9]/.test(val),{
                message:"The password must have on special character",
            })
    })
const parseResult=Usersignup.safeParse(req.body);

if(!parseResult.success){
       const errors=parseResult.error.format();

       return res.status(411).json({
        message:"Error in inputs typed In",
        errors
       })
    }

 const username=req.body.username;
 const password=req.body.password;
 const existingUser =await UserModel.findOne({username});
 if(existingUser){
    return res.status(403).json({
        message:"User alredy exits"
    })
 }
 const hashedpassword=await bcyrpt.hash(password,5);
 const send=await UserModel.create({
    username:username,
    password:hashedpassword
 })
 console.log(send);
 
 return res.status(200).json({
    message:"User has logged iN succesfully"
 })
}catch(e){
    return res.status(500).json({
        message:"Server Error"
    })
}


})

app.post("/app/v1/signin",async (req,res)=>{
    try{
    const {username,password}=req.body;
    
    const response= await UserModel.findOne({username});
    if(!response){
        return res.send(403).json({
            message:"User Does Not Exits"
        })
    }
    if(!response.password){
        return  res.send(403).json({
            message:"User and Password Does Not Exits"
        })
    }

    const passwordMatch=await bcyrpt.compare(password,response.password)
    if(passwordMatch && jwtkey){
        const token=jwt.sign({
            id:response._id.toString()
        },jwtkey);
        return res.status(200).json({
            token:token
        })
    }else{
        return res.status(403).json({
            message:"Wrong Email Or Password"
        })
    }
}catch(e){
    return res.status(500).json({
        message:"Server Error"
    })
}

})


app.post("/app/v1/content",userMiddleware,async (req,res)=>{
     //@ts-ignore
    const userid=req.userid;
    const {link,type,title,tags}=req.body;
    await ContentModel.create({
        link,
        type,
        title,
        tags,
        userid
    })

    res.status(200).json({
        message:"Content Added "
    })

})


app.get("/app/v1/content",userMiddleware,async (req,res)=>{
    //@ts-ignore
    const userid=req.userid;
    const content=await ContentModel.find({
        userid
    }).populate("userid","username")

    res.status(200).json({
        content
    })
})

app.delete("/app/v1/content",userMiddleware,async (req,res)=>{
     //@ts-ignore
    const userid=req.userid;
    const contentId=req.body.contentid;
    await ContentModel.deleteOne({
        userid,
        _id:contentId
    })

    res.status(200).json({
        msg:"content deleted"
    })
})

app.post("/app/v1/brain/share",userMiddleware,async (req,res)=>{
    const share=req.body.share;
    const userid=req.userid
    if(share){
        const existingUser=await LinkModel.findOne({
            userid
        })
        
        if(existingUser){
            res.json({
               hash: existingUser?.hash
            })
        }

        const hash = random(10);
            await LinkModel.create({
                userid: req.userid,
                hash: hash
            })

            res.json({
                hash
            })
    }else{
        await LinkModel.deleteOne({
            userid: req.userid
        });

        res.json({
            message: "Removed link"
        })
    }
})
app.get("/app/v1/brain/:shareLink",async (req,res)=>{
    const hash=req.params.shareLink;

    const link=await LinkModel.findOne({
        hash
    });
    if(!link){
        res.status(403).json({
            message:"Link does not exits"
        })
        return;//early return
    }

    const content=await ContentModel.find({
        userid:link.userid
    })

    const user=await UserModel.findOne({
        _id:link.userid
    })
    if(!user){
         res.status(403).json({
            message:"Link does not exits"
        })
        return;//early return
    }
    return res.status(200).json({
        username:user.username,
        content
    })
    
})

app.listen(3000)