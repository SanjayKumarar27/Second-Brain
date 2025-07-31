import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Request,Response,NextFunction } from "express";

dotenv.config();

const jwtsecret=process.env.JWT_TOKEN;


export function userMiddleware(req:Request,res:Response,next:NextFunction){
    const header=req.headers["authorization"];
    console.group(header)
    if(!jwtsecret){
        return res.status(500).json({
            message:"Now jwt secret key"
        })
    }
    //@ts-ignore
    const decoded=jwt.verify(header,jwtsecret);
    if(decoded){
        //@ts-ignore
        req.userid=decoded.id;
        next();
    }else{
        return res.status(405).json({
            message:"User are not Signed In"
        })

    }
}