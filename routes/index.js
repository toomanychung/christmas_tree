/* eslint-disable no-underscore-dangle */
const moment = require('moment');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const { Router } = require('express');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const settingController = require('../controllers/settingController');

const endpointSecret = process.env.STRIPE_WEBHOOK;

const router = Router();

router.use(async (req, res, next) => {
  const announcement = await settingController.getAnnouncementSetting();
  res.locals.announcement = announcement.content || '';
  next();
});

/* Index */
router.get('/', (req, res) => {
  res.render('index', {

  });
});

router.get('/about', (req, res) => {
  res.render('about', {

  });
});

router.get('/product', (req, res) => {
  res.render('product', {

  });
});

router.get('/contact', (req, res) => {
  res.render('contact', {

  });
});

/* Cart */
router.get('/cart', (req, res) => {
  res.render('cart', {

  });
});

router.get('/checkout', (req, res) => {
  res.render('checkout', {

  });
});

router.get('/thank-you', async (req, res) => {
  const urlId = req.query.id;
  if (urlId.startsWith('cs')) {
    const result = await orderController.qureyOrderByStripeRef(urlId);
    if (!result) {
      res.redirect('/');
      return null;
    }
    const date = moment(result.create_time).format('YYYY-MM-DD HH:mm');
    res.render('thankyou', {
      orderRef: result._id,
      amountPaid: result.total_price / 100,
      date
    });
    return null;
  }
  const result = await orderController.qureyOrderByOrderId(urlId);
  const date = moment(result.create_time).format('YYYY-MM-DD HH:mm');
  if (result) {
    res.render('thankyou-bank', {
      orderRef: result._id,
      amountPaid: result.total_price / 100,
      date
    });
  }
  return null;
});

router.post('/checkout', async (req, res) => {
  const payload = req.body;
  const stripeURL = await cartController.checkout(payload);
  res.status(200).send(stripeURL);
});

router.post('/checkout2', async (req, res) => {
  const payload = req.body;
  const objId = await orderController.createBankInOrder(payload);
  if (!objId) {
    res.status(404);
  }
  res.status(200).send(objId);
});

/* Webhook */

router.post('/webhook/', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Fulfill the purchase...
    console.log('webhook OK', session);
    orderController.createOrder(session);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
  return true;
});

// The 404 Route (ALWAYS Keep this as the last route)


module.exports = router;
