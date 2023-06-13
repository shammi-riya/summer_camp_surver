const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.PEMENT_SECRET_KEY)

const cors = require('cors');


const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }

  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}






const uri = `mongodb+srv://${process.env.name}:${process.env.pass}@cluster0.f4myxpg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const classCollection = client.db('summer-camp').collection('class');

    const selectClassCollection = client.db('summer-camp').collection('selectClass');
    const usersCollection = client.db('summer-camp').collection('users');
    const paymentCollection = client.db('summer-camp').collection('pement');



    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })







    app.post("/users", async (req, res) => {
      const user = req.body;
      const quiry = { email: user.email }

      const exitUser = await usersCollection.findOne(quiry);
      if (exitUser) {
        return res.send({ message: "user already exit" })
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    })


    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })


    app.get("/instractors", async (req, res) => {
      const instructors = await usersCollection.find({ role: "instractor" }).limit(6).toArray();
      res.send(instructors)
    })

    app.get("/allInstractors", async (req, res) => {
      const instructors = await usersCollection.find({ role: "instractor" }).toArray();
      res.send(instructors)
    })



    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false })
      }
     
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role == 'admin' }
     
      res.send(result);
    })









    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin"
        },
      };


      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })



    app.patch("/users/instractor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instractor"
        },
      };


      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    })



    app.get('/users/instractor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ instractor: false })
      }
     
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { instractor: user?.role == 'instractor' }
   
      res.send(result);
    })



    app.get("/instractor/:email", async (req, res) => {
      const email = req.params.email;
    
      const query = { instructorEmail: email }
     
      const result = await classCollection.find(query).toArray();
      res.send(result)
    })





    // class Collction

    app.get("/class", async (req, res) => {
      const result = await classCollection.find().sort({ numberOfStudents: -1 }).limit(6).toArray();
      res.send(result);

    })






    app.post("/class", async (req, res) => {
      const newClass = req.body;
      const result = await classCollection.insertOne(newClass);
      res.send(result)
    })


    app.get("/allClass", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    })





    // app.patch("/class/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const { feedback } = req.body;
    //   const filter = { _id: new ObjectId(id) };
    //   const updateDoc = {
    //     $set: { feedback },
    //   };

    //   try {
    //     const result = await classCollection.updateOne(filter, updateDoc);
    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send({ error: "Failed to update feedback." });
    //   }
    // });






    app.patch("/allClass/:id", async (req, res) => {
      const id = req.params.id;
     
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          stutus: "Approve"
        },
      };


      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    })






    app.patch("/allClass/danny/:id", async (req, res) => {
      const id = req.params.id;
      
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          stutus: "Deny"
        },
      };


      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    })









    app.post("/selectClass", async (req, res) => {
      const body = req.body;
      const result = await selectClassCollection.insertOne(body);
      res.send(result);
    })




    app.get("/selectClass", verifyJWT, async (req, res) => {
      const email = req.query.email;


      if (!email) {
        res.send([])
      }
      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }

      const quiry = { email: email };
      const result = await selectClassCollection.find(quiry).toArray();
      res.send(result);
    })


    app.delete("/selectClass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectClassCollection.deleteOne(query);
      res.send(result);
    })





    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
      const { price } = req.body;
     
      const amount = parseInt(price)*100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
console.log(amount);
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })





    app.post('/payment', verifyJWT, async (req, res) => {
      const payment = req.body;
      const insertResult = await paymentCollection.insertOne(payment);
    
      const query = { _id: new ObjectId(payment.classId) };
      console.log(query);

      const deleteResult = await selectClassCollection.deleteOne(query);
    
      res.send({ insertResult, deleteResult });
    });











    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);











app.get('/', (req, res) => {
  res.send('summer camp')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})