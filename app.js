const express = require("express");
const bodyParser = require("body-parser");
const QRCode = require("qrcode");
const Stripe = require("stripe");
const path = require("path");
const stripe = Stripe("STRIPE_KEy");

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Endpoint to create a Stripe Checkout Session and generate a QR code
app.post("/create-checkout-session", async (req, res) => {
  const { amount, currency } = req.body;

  try {
    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: "QR Code Payment",
            },
            unit_amount: amount * 100, // Stripe requires amounts in the smallest unit of currency (e.g., cents)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:3000/success", // URL after successful payment
      cancel_url: "http://localhost:3000/cancel", // URL if payment is canceled
    });

    // Generate QR code that directs the user to the Checkout Session URL
    const qrCodeData = await QRCode.toDataURL(session.url);

    // Respond with the QR code and session ID
    res.json({ qrCode: qrCodeData, sessionId: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create payment session" });
  }
});

// Serve the success and cancel pages
app.get("/success", (req, res) => {
  res.send("Payment Successful!");
});

app.get("/cancel", (req, res) => {
  res.send("Payment Canceled");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
