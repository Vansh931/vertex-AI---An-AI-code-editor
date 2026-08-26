import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import router from "./routes/payment.route.js"

const port =process.env.PORT

const app=express()
app.use(express.json())
app.use("/",router)
app.get("/",(req,res)=>{
    res.json({message:"hello from payment service"})
})

app.listen(port,()=>{
    connectDb()
    console.log(`payment service started at ${port}`)
    
})