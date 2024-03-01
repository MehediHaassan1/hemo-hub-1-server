require('dotenv').config()
const express = require('express')
var cors = require('cors')
var cron = require('node-cron');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

// *********** MIDDLEWARE *********** //
app.use(cors())
app.use(express.json())

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    });
}

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
        const subdistrictCollection = client.db('hemoHubDB').collection('subdistricts');
        const userCollection = client.db('hemoHubDB').collection('users');
        const donationRequestCollection = client.db('hemoHubDB').collection('donationRequests');

        // ********** JWT Start********** //
        app.post('/jwt', async (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN);
            res.send({ token });
        })
        // ********** JWT End********** //

        // ********* * admin route start * **************** //
        app.get('/api/v1/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin'
            }
            res.send({ admin });
        })
        // ********* * admin route end * **************** //


        // ******** verify admin ********* //
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) return res.status(403).send({ message: 'Unauthorized Access' })
            next();
        }

        app.get('/api/v1/divisions', async (req, res) => {
            const result = await divisionCollection.find().toArray();
            res.send(result);
        })

        app.get('/api/v1/districts', async (req, res) => {
            const result = await districtCollection.find().toArray();
            res.send(result)
        })

        app.get('/api/v1/subdistricts', async (req, res) => {
            const result = await subdistrictCollection.find().toArray();
            res.send(result)
        })

        app.post('/api/v1/users', async (req, res) => {
            const userInfo = req.body;
            const query = { email: userInfo.email };
            const exists = await userCollection.findOne(query)
            if (!exists) {
                const result = await userCollection.insertOne(userInfo);
                res.send(result);
            } else {
                res.send({ insertedUser: true });
            }
        })

        app.get('/api/v1/user/:uid', verifyJWT, async (req, res) => {
            if (!req.decoded.email) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const uid = req.params.uid;
            const query = { uid }
            const result = await userCollection.findOne(query);
            res.send(result);
        })

        app.post('/api/v1/create-donation-request', verifyJWT, async (req, res) => {
            if (!req.decoded.email) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const donationInfo = req.body;
            const result = await donationRequestCollection.insertOne(donationInfo);
            res.send(result);
        })

        app.get('/api/v1/my-donation-request/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                return res.status(401).send({ message: 'unauthorized access' })
            }
            const query = { requesterEmail: email };
            const result = await donationRequestCollection.find(query).sort({ _id: -1 }).toArray();
            res.send(result);
        })

        app.patch('/api/v1/update-user-info/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const updatedInfo = req.body;
            const query = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: updatedInfo
            };
            const result = await userCollection.updateOne(query, updateDoc);
            res.send(result);
        })

        app.patch('/api/v1/update-request-status/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const updatedStatus = req.body.status;
            const updateDoc = {
                $set: {
                    status: updatedStatus
                }
            };
            const result = await donationRequestCollection.updateOne(query, updateDoc)
            res.send(result);
        })

        app.delete('/api/v1/delete-donation-request/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await donationRequestCollection.deleteOne(query);
            res.send(result);
        })

        app.get('/api/v1/stats', verifyJWT, verifyAdmin, async (req, res) => {
            const currentDate = new Date();
            const previousMonthStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
            const previousMonthEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);

            const previousPreviousMonthStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
            const previousPreviousMonthEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 0);

            const previousMonthUsersData = await userCollection.countDocuments({
                createdAt: { $gte: previousMonthStartDate, $lte: previousMonthEndDate }
            });

            const previousMonthRequestsData = await donationRequestCollection.countDocuments({ createdAt: { $gte: previousMonthStartDate, $lte: previousMonthEndDate } })

            const previousPreviousMonthUsersData = await userCollection.countDocuments({
                createdAt: { $gte: previousPreviousMonthStartDate, $lte: previousPreviousMonthEndDate }
            });
            const previousPreviousMonthRequestsData = await donationRequestCollection.countDocuments({ createdAt: { $gte: previousPreviousMonthStartDate, $lte: previousPreviousMonthEndDate } })


            const usersPercentage = ((previousMonthUsersData - previousPreviousMonthUsersData) / previousPreviousMonthUsersData) * 100;


            const requestPercentage = ((previousMonthRequestsData - previousPreviousMonthRequestsData) / previousPreviousMonthRequestsData) * 100;

            const usersCount = await userCollection.estimatedDocumentCount();
            const requestsCount = await donationRequestCollection.estimatedDocumentCount();

            const usersStats = {
                count: usersCount,
                percentage: usersPercentage

            }
            const requestsStats = {
                count: requestsCount,
                percentage: requestPercentage
            }

            res.send({ usersStats, requestsStats })
        })

        app.get('/api/v1/all-users', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        app.get('/api/v1/all-requests', verifyJWT, verifyAdmin, async (req, res) => {
            const result = await donationRequestCollection.find().toArray();
            res.send(result);
        })

        const cancelOldStatuses = async () => {
            // Get the current date and time
            const currentDateTime = new Date();
            const originalDateTime = moment(currentDateTime);

            // Format the parsed date and time to the desired format
            const formattedDateTime = originalDateTime.format('DD-MM-YYYY');
            console.log(formattedDateTime);
            console.log('01-03-2025');
            const query = { donationDate: '29-02-2024', status: { $in: ['Pending', 'Inprogress'] } }
            // const query = { donationDate: { $lt: formattedDateTime }, status: { $in: ['Pending', 'Inprogress'] } }
            const documents = await donationRequestCollection.find(query).toArray();
            console.log(documents);
            for (const document of documents) {
                await donationRequestCollection.updateOne({ _id: document._id }, { $set: { status: 'Canceled' } })
            }
        }
        cron.schedule('0 0 * * *', cancelOldStatuses); // Run every day at midnight




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