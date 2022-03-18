const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

// set the view engine to ejs
app.set("view engine", "ejs");

// bodyParser module needs to be set to use req.body
app.use(bodyParser.urlencoded({
  extended: true
}));

// access static files
app.use(express.static("public"));

// connecting to mongoose
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://admin-elizabeth:Test123@cluster0.1owru.mongodb.net/todolistDB');
};

// creating a schema for one property
const itemsSchema = {
  name: String
};

//create a model
const Item = mongoose.model("item", itemsSchema) // creating a model needs to capitalised e.g. Item

// create multiple documents
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit + button to add item"
});

const item3 = new Item({
  name: "Hit <-- this button to delete item"
});

const defaultItems = [item1, item2, item3]

// creating a list schema for customListName
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("list", listSchema);


// index page
app.get("/", function(req, res) {
  // find all items in database
  Item.find({}, function(err, item) {
    if (item.length === 0) {
      // insert documents into database
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log("Successfully added");
        }
      });
      res.redirect("/");
    } else {
      // use res.render to load up an ejs view file
      res.render("list", {
        listTitle: "Today",
        newListItems: item
      });
    }
  });
});

// use express paramaters to create a custom list
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  // finding a list in the mongoose database
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        // create a new list
        const list = new List ({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customListName);

      } else {
        // show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });




});

// posting to add items
app.post("/", function(req, res) {
  const newItem = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: newItem
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// posting to delete items
app.post("/delete", function(req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;
  // delete item from database based on the ID
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (!err) {
        console.log("Success");
        res.redirect("/");
      }
    });
  } else {
    // more efficient way of removing an array item in mongoose
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
  });
}
});

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port =="") {
  port=3000
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
