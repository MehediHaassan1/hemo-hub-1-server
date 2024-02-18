require('dotenv').config()
const express = require('express')
var cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

// *********** MIDDLEWARE *********** //
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hemo Hub server is running.')
})


// *********** MONGODB START *********** //

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xngnl6i.mongodb.net/?retryWrites=true&w=majority`;

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
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const divisionCollection = client.db('hemoHubDB').collection('divisions');
        const districtCollection = client.db('hemoHubDB').collection('districts');
        const upazillaCollection = client.db('hemoHubDB').collection('upazillas');

        app.get('/api/v1/divisions', async (req, res) => {
            const result = await divisionCollection.find().toArray();
            res.send(result);
        })

        app.get('/api/v1/districts', async (req, res) => {
            const result = await districtCollection.find().toArray();
            res.send(result)
        })

        app.get('/api/v1/upazillas', async (req, res) => {
            const result = await upazillaCollection.find().toArray();
            res.send(result)
        })

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// *********** MONGODB END *********** //




app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})