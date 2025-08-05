const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Replace with your actual Stripe secret key

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Payment intent error:", err);
    res.status(500).json({ error: "Payment failed" });
  }
};
