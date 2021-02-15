//declaration of initial variables
const express = require('express');
const app = express();

const {
    Client,
    Config,
    CheckoutAPI
} = require('@adyen/api-library');
const config = new Config();

const {
    v4: uuidv4
} = require('uuid');
require('dotenv').config();

// Set your X-API-KEY with the API key from the Customer Area.
config.apiKey = process.env.api_key;
config.merchantAccount = process.env.merchant_account;
const client = new Client({
    config
});

client.setEnvironment("TEST");
const checkout = new CheckoutAPI(client);

app.set("view engine", "ejs");
app.set("views", "./views")

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


//redirect based on the response
app.get("/", (req, res) => {
    res.render('index');
});

app.get("/payment", (req, res) => {
    res.render('payment');
});

app.get("/result/success", (req, res) => {
    res.render('success');
});

app.get("/result/failed", (req, res) => {
    res.render('failed');
});

app.get("/result/error", (req, res) => {
    res.render('error');
});

app.get("/result/pending", (req, res) => {
    res.render('pending');
});



// Pass the response to your front end

app.get("/getPaymentMethod/:country", async (req, res) => {
    try {
        const response = await checkout.paymentMethods({
            channel: "Web",
            merchantAccount: config.merchantAccount,
            countryCode: req.params.country

        });
        res.json(response);
    } catch (err) {
        console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
        res.status(err.statusCode).json(err.message);
    }
});

// A temporary store to keep payment data to be sent in additional payment details and redirects.
// This is more secure than a cookie. In a real application this should be in a database.
const paymentDataStore = {};

app.post("/api/initiatePayment", async (req, res) => {
    try {
        // unique ref for the transaction
        const orderRef = uuidv4();
        // Ideally the data passed here should be computed based on business logic
        const response = await checkout.payments({
            amount: {
                currency: "EUR",
                value: 100
            }, // value is 10€ in minor units
            reference: orderRef, // required
            merchantAccount: config.merchantAccount,
            channel: "Web", // required
            // we pass the orderRef in return URL to get paymentData during redirects
            returnUrl: `http://localhost:4000/api/handleShopperRedirect?orderRef=${orderRef}`, // required for redirect flow
            browserInfo: req.body.browserInfo,
            paymentMethod: req.body.paymentMethod // required
        });

        const {
            action
        } = response;

        if (action) {
            paymentDataStore[orderRef] = action.paymentData;
        }
        res.json(response);
    } catch (err) {
        console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
        res.status(err.statusCode).json(err.message);
    }
});

// handle both POST & GET requests
app.all("/api/handleShopperRedirect", async (req, res) => {
    // Create the payload for submitting payment details
    const orderRef = req.query.orderRef;
    const redirect = req.method === "GET" ? req.query : req.body;
    const details = {};
    if (redirect.redirectResult) {
        details.redirectResult = redirect.redirectResult;
    } else {
        details.MD = redirect.MD;
        details.PaRes = redirect.PaRes;
    }

    const payload = {
        details,
        paymentData: paymentDataStore[orderRef],
    };

    try {
        const response = await checkout.paymentsDetails(payload);
        // Conditionally handle different result codes for the shopper
        switch (response.resultCode) {
            case "Authorised":
                res.redirect("/result/success");
                break;
            case "Pending":
            case "Received":
                res.redirect("/result/pending");
                break;
            case "Refused":
                res.redirect("/result/failed");
                break;
            default:
                res.redirect("/result/error");
                break;
        }
    } catch (err) {
        console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
        res.redirect("/result/error");
    }
});

app.post("/api/submitAdditionalDetails", async (req, res) => {
    // Create the payload for submitting payment details
    const payload = {
        details: req.body.details,
        paymentData: req.body.paymentData,
    };

    try {
        // Return the response back to client (for further action handling or presenting result to shopper)
        const response = await checkout.paymentsDetails(payload);
        res.json(response);
    } catch (err) {
        console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
        res.status(err.statusCode).json(err.message);
    }
});



const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});