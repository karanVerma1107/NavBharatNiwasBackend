import mongoose from "mongoose";


const connectDB = async() =>{
    try{
        const connectionbase = await mongoose.connect(`${process.env.URI}`);
        console.log(`mongoDB has connected with DB HOST !! ${connectionbase.connection.host}`);
    }catch(error){
console.log(`mongodb connection error: `, error);
process.exit(1);
    }
}

export default connectDB;