import type { Request, Response } from "express";

export const globalErrorHandler =(err:any,req:Request,res:Response,next:any)=>{
    return res.status(err.status|| 500).json({
        message:err.message,
        status:err.status,
        cause:err.cause,
    })

}
