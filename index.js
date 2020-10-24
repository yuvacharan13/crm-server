const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const mongodb = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = process.env.PORT || 4040;


function authorize(req, res, next) {
  try {
    if (req.headers.auth !== undefined) {
      let jwtmessage = jwt.verify(req.headers.auth, process.env.JWTTK);
      res.locals.user = jwtmessage.user;
      next();
    } else {
      res.status(404).json({ message: "authorization failed" });
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "authorization failed" });
  }
}

app.get("/", (req, res) => {
  res.send("CRM Application");
});

app.get("/dashboard", [authorize], async (req, res) => {
  var user = req.body;
  try {
    // do something ....
    const client = await mongodb.connect(process.env.DBURL);
    const db = client.db("crm");
    var [service, leads, contacts] = await Promise.all([
      db.collection("service").find().toArray(),
      db.collection("leads").find().toArray(),
      await db.collection("contacts").find().toArray(),
    ]);
    console.log(service.length, leads.length, contacts.length);

    res.json({ message: "success", service, leads, contacts });
  } catch (err) {}
});

app.put("/service", [authorize], async (req, res) => {
  try {
    var reqData = req.body;
    const client = await mongodb.connect(process.env.DBURL);
    var db = client.db("crm");
    console.log(res.locals.user);
    var data = await db
      .collection("users")
      .findOne({ email: res.locals.user.email });
    if (data !== null) {
      if (data.permission !== "edit") {
        res.json({ message: "You do not have permission to add or edit" });
        await client.close();
        return;
      } else if (data.permission === "edit") {
        var contactmatch = await db
          .collection("contacts")
          .findOne({ email: reqData.email });

        if (contactmatch === null) {
          res
            .status(404)
            .json({
              message:
                "Contact not found in database. Create a contact for the lead",
            });
          await client.close();
          return;
        }

        var service = await db
          .collection("service")
          .updateOne(
            { _id: mongodb.ObjectID(reqData._id) },
            {
              $set: {
                status: reqData.status,
                description: reqData.description,
                email: reqData.email,
                lastEditedAt: new Date(),
              },
            }
          );
        res.json({ message: "success", service: service });
        await client.close();
        return;
      }
    } else {
      res.status(404).json({ message: "failed" });
      await client.close();
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "failed" });
    return;
  }
});

app.get("/service", [authorize], async (req, res) => {
  try {
    const client = await mongodb.connect(process.env.DBURL);
    const db = client.db("crm");
    console.log(res.locals.user);
    var data = await db
      .collection("users")
      .findOne({ email: res.locals.user.email });
    if (data !== null) {
      if (data.permission === "none") {
        res.json({ message: "You do not have permission to view" });
        return;
      } else {
        const db = client.db("crm");
        var service = await db.collection("service").find().toArray();
        res.json({ message: "success", service: service });
        return;
      }
    } else {
      res.status(404).json({ message: "failed" });
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "failed" });
    return;
  }
});

app.post("/service", [authorize], async (req, res) => {
  try {
    var reqData = req.body;
    const client = await mongodb.connect(process.env.DBURL);
    var db = client.db("crm");
    console.log(res.locals.user);
    var data = await db
      .collection("users")
      .findOne({ email: res.locals.user.email });
    if (data !== null) {
      if (data.permission !== "edit") {
        res.json({ message: "You do not have permission to add or edit" });
        await client.close();
        return;
      } else if (data.permission === "edit") {
        var contactmatch = await db
          .collection("contacts")
          .findOne({ email: reqData.email });

        if (contactmatch === null) {
          res
            .status(404)
            .json({
              message:
                "Contact not found in database. Create a contact for the service request",
            });
          await client.close();
          return;
        }
        reqData.createdBy = {
          name: data.name,
          email: data.email,
          access: data.access,
        };
        reqData.createdAt = new Date();
        var service = await db.collection("service").insertOne({ ...reqData });
        res.json({ message: "success", service: service });
        await client.close();
        return;
      }
    } else {
      res.status(404).json({ message: "failed" });
      await client.close();
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "failed" });
    return;
  }
});

app.put("/leads", [authorize], async (req, res) => {
  try {
    var reqData = req.body;
    const client = await mongodb.connect(process.env.DBURL);
    var db = client.db("crm");
    console.log(res.locals.user);
    var data = await db
      .collection("users")
      .findOne({ email: res.locals.user.email });
    if (data !== null) {
      if (data.permission !== "edit") {
        res.json({ message: "You do not have permission to add or edit" });
        await client.close();
        return;
      } else if (data.permission === "edit") {
        var contactmatch = await db
          .collection("contacts")
          .findOne({ email: reqData.email });

        if (contactmatch === null) {
          res
            .status(404)
            .json({
              message:
                "Contact not found in database. Create a contact for the lead",
            });
          await client.close();
          return;
        }

        var leads = await db
          .collection("leads")
          .updateOne(
            { _id: mongodb.ObjectID(reqData._id) },
            {
              $set: {
                status: reqData.status,
                description: reqData.description,
                email: reqData.email,
                lastEditedAt: new Date(),
              },
            }
          );
        res.json({ message: "success", leads: leads });
        await client.close();
        return;
      }
    } else {
      res.status(404).json({ message: "failed" });
      await client.close();
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "failed" });
    return;
  }
});

app.post("/leads", [authorize], async (req, res) => {
  try {
    var reqData = req.body;
    const client = await mongodb.connect(process.env.DBURL);
    var db = client.db("crm");
    console.log(res.locals.user);
    var data = await db
      .collection("users")
      .findOne({ email: res.locals.user.email });
    if (data !== null) {
      if (data.permission !== "edit") {
        res.json({ message: "You do not have permission to add or edit" });
        await client.close();
        return;
      } else if (data.permission === "edit") {
        var contactmatch = await db
          .collection("contacts")
          .findOne({ email: reqData.email });

        if (contactmatch === null) {
          res
            .status(404)
            .json({
              message:
                "Contact not found in database. Create a contact for the lead",
            });
          await client.close();
          return;
        }
        reqData.createdBy = {
          name: data.name,
          email: data.email,
          access: data.access,
        };
        reqData.createdAt = new Date();
        var leads = await db.collection("leads").insertOne({ ...reqData });
        res.json({ message: "success", leads: leads });
        await client.close();
        return;
      }
    } else {
      res.status(404).json({ message: "failed" });
      await client.close();
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "failed" });
    return;
  }
});

app.get("/leads", [authorize], async (req, res) => {
  try {
    const client = await mongodb.connect(process.env.DBURL);
    const db = client.db("crm");
    console.log(res.locals.user);
    var data = await db
      .collection("users")
      .findOne({ email: res.locals.user.email });
    if (data !== null) {
      if (data.permission === "none") {
        res.json({ message: "You do not have permission to view" });
        return;
      } else {
        const db = client.db("crm");
        var leads = await db.collection("leads").find().toArray();
        res.json({ message: "success", leads: leads });
        return;
      }
    } else {
      res.status(404).json({ message: "failed" });
      return;
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "failed" });
    return;
  }
});

app.post("/access", [authorize], async (req, res) => {
  console.log(req.body);
  try {
    const client = await mongodb.connect(process.env.DBURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db("crm");
    var data = await db
      .collection("users")
      .findOne({ email: res.locals.user.email });
    if (
      data.access === "manager" ||
      (data.access === "admin" && data.permission === "edit")
    ) {
      var users = await db
        .collection("users")
        .updateOne(
          { _id: mongodb.ObjectID(req.body._id) },
          { $set: { permission: req.body.permission } }
        );

      res.json({ message: "success", users: users });
    } else {
      res.status(404).json({ message: "You do not have permission to edit" });
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "failed" });
  }
});

app.get("/access", [authorize], async (req, res) => {
  try {
    const client = await mongodb.connect(process.env.DBURL);
    const db = client.db("crm");
    var data = await db
      .collection("users")
      .findOne({ email: res.locals.user.email });
    console.log(data);
    if (
      (data.access === "manager" || data.access === "admin") &&
      (data.permission === "view" || data.permission === "edit")
    ) {
      var users = await db
        .collection("users")
        .find({ access: { $not: /^admin/ } }, { password: 0 })
        .toArray();
      users = users.filter((user) => user.email !== data.email);
      res.json({ message: "success", users: users });
      await client.close();
    } else {
      res.status(404).json({ message: "You do not have permission to view" });
      await client.close();
    }
  } catch (err) {
    res.status(404).json({ message: "failed" });
  }
});

app.get("/contact", [authorize], async (req, res) => {
  try {
    const client = await mongodb.connect(process.env.DBURL);
    const db = client.db("crm");
    console.log(res.locals.user);
    var data = await db
      .collection("users")
      .findOne({ email: res.locals.user.email });
    if (data !== null) {
      if (data.permission === "none") {
        res.json({ message: "You do not have permission to view" });
        return;
      } else {
        const db = client.db("crm");
        var contacts = await db.collection("contacts").find().toArray();
        res.json({ message: "success", contacts: contacts });
        return;
      }
    }
  } catch (err) {
    console.log(err);
    res.json({ message: "failed" });
    return;
  }
});

app.post("/contact", [authorize], async (req, res) => {
  try {
    const client = await mongodb.connect(process.env.DBURL);
    const db = client.db("crm");
    var data = await db
      .collection("users")
      .findOne({ email: res.locals.user.email });
    if (data !== null) {
      if (data.permission !== "edit") {
        res.json({ message: "You do not have permission to add or edit" });
        return;
      } else if (data.permission === "edit") {
        var contacts = await db
          .collection("contacts")
          .insertOne({ ...req.body });
        res.json({ message: "success", contacts: contacts });
        return;
      }
    }
  } catch (err) {
    console.log(err);
    res.json({ message: "failed" });
    return;
  }
});

app.post("/signin", async (req, res) => {
  var user = req.body;
  try {
    const client = await mongodb.connect(process.env.DBURL, { useUnifiedTopology: true });
    const db = client.db("crm");
    var data = await db.collection("users").findOne({ email: user.email });
    if (data === null) {
      res.status(404).json({ message: "User does not exists" });
      return;
    }
    const result = await bcrypt.compare(user.password, data.password);
    if (result) {
      const { _id, email } = data;
      delete data.password;
      let jwtToken = jwt.sign({  id: _id, email: email }, process.env.JWTTK, {
        expiresIn: "1h",
      });
      res.json({ message: "success", user: data, jwtToken: jwtToken });
    } else {
      res.json({ message: "Password not matching" });
    }
  } catch (err) {
    console.log(err);
    res.json({ message: "failed" });
    return;
  }
});

app.post("/signup", async (req, res) => {
  var user = req.body;
  if (user.access === "manager" || user.access === "admin") {
    user.permission = "edit";
  } else {
    user.permission = "none";
  }
  user.isEmailVerified = false;
  try {
    const client = await mongodb.connect(process.env.DBURL, { useUnifiedTopology: true });
    const db = client.db("crm");
    const data = await db
      .collection("users")
      .findOne({ email: user.email }, { name: 1 });
    console.log(data);
    if (data !== null) {
      res.json({ message: "User already exists" });
      return;
    }
  } catch (err) {
    console.log(err);
    res.json({ message: "failed" });
    return;
  }
  var hash = await bcrypt.hash(user.password, 10);
  user.password = hash;
  try {
    const client = await mongodb.connect(process.env.DBURL);
    const db = client.db("crm");
    const data = await db.collection("users").insertOne(user);
    await client.close();
    res.json({ message: "success" });
  } catch (err) {
    console.log(err);
    res.json({ message: "failed" });
  }
});

app.listen(port, () => {
  console.log("Listening to the port... ");
});
