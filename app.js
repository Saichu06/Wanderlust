const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing=require("./models/listing.js")
const path=require('path');


const MONGO_URL='mongodb://127.0.0.1:27017/wanderlust';

const methodOverride = require("method-override");

app.use(methodOverride("_method"));

main().then(()=>{
    console.log("Connected to db!");
}).catch((err)=>{
    console.log(err);
})

async function main(){
    await mongoose.connect(MONGO_URL)
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}))



// INDEX
app.get("/listings", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
});

// NEW ROUTE (form)
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

// SHOW ROUTE (dynamic id)
app.get("/listings/:id", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
});

//NEW ROUTE TO INSERT - POST
app.post("/listings",async(req,res)=>{
    let newListing=new Listing(req.body.listing);
    await newListing.save();

    res.redirect("/listings");
})


//UPDATE ROUTE
app.put("/listings/:id",async(req,res)=>{
    const {id}=req.params;
    await Listing.findByIdAndUpdate(id,req.body.listing);
    res.redirect(`/listings/${id}`);
})

//EDIT ROUTE

app.get("/listings/:id/edit",async(req,res)=>{
    const {id}=req.params;
    const listing=await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
})

//DELETE ROUTE
app.delete("/listings/:id",async(req,res)=>{
    const {id}=req.params;
    await Listing.findByIdAndDelete(id);
    console.log("Deleted listing");
    res.redirect("/listings")
})

app.listen(8080,()=>{
    console.log("Server is listening!");
})
