/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
const stripe = require('stripe')(process.env.STRIPE_KEY);
const {
  product,
  cart,
  coupon,
  delivery
} = require('../model/main');


async function calculateCart(userCart) {
  var errMsg = '';
  if (!userCart) {
    return false;
  }
  let totalPrice = 0;
  let productDetails = await product.find({}, { _id: 0 }, (err, res) => res);
  productDetails = productDetails[0].toObject();
  if (userCart.length > 10) {
    errMsg = 'No more than 10 item in cart';
  }
  userCart.forEach((item) => {
    if (item.product !== 'pw') {
      const treePrice = productDetails[item.product][item.size].price;
      const standPrice = productDetails.stand[item.stand].price;
      const sumPrice = treePrice + standPrice;
      if (productDetails[item.product][item.size].stock < 1) {
        errMsg = 'Out of Stock';
      }
      totalPrice += sumPrice;
    } else if (item.product === 'pw') {
      const treePrice = productDetails[item.product][item.size].price;
      const { quantity } = item;
      if (quantity < 0 || quantity > 100) {
        errMsg = 'Quantity cant be 0 or over 100';
      }
      if (productDetails[item.product][item.size].stock < quantity) {
        errMsg = 'Out of Stock';
      }
      const sumPrice = treePrice * quantity;
      totalPrice += sumPrice;
    }
  });

  if (!errMsg) {
    return Math.round(totalPrice);
  }
  console.log('Error when calcuate Price!!', errMsg);
  return 0;
}

async function getDeliveryPrice(region, floorCharge) {
  const result = await delivery.findOne({ value: region }, { _id: 0 }, (err, res) => res);
  if (parseInt(floorCharge, 10) > 0) {
    const floorAmount = parseInt(floorCharge, 10) * 75;
    return result.price + floorAmount;
  }
  return result.price;
}

module.exports = {
  async checkout(payload) {
    var promise = cart.create(payload);
    const stripeId = await promise.then(async (result) => {
      var _description = 'Self Pick Up';
      const userCart = result.cart;
      const refId = result._id.toHexString();
      const customerEmail = result.cInfo.email;
      const couponCode = result.cInfo.coupon;
      let priceAftercalculated = await calculateCart(userCart);
      if (priceAftercalculated === 0) {
        return false;
      }
      const deliveryMethod = result.cInfo.delivery_method;
      // Standard Delivery + Floor Charge
      if (deliveryMethod === 1) {
        const deliveryRegion = result.cInfo.region;
        const floorCharge = result.cInfo.floor;
        const deliveryPrice = await getDeliveryPrice(deliveryRegion, floorCharge);
        priceAftercalculated += deliveryPrice;
        _description = 'Including Delivery';
      }
      // Coupon
      if (couponCode !== '') {
        const couponDetails = await coupon.findOne({ code: couponCode, valid: true }, { _id: 0 }, (err, res) => res);
        if (couponDetails) {
          const couponValue = couponDetails.discount;
          priceAftercalculated *= 1 - couponValue;
        }
      }

      if (priceAftercalculated) {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            name: 'Christmas Trees',
            description: _description,
            amount: Math.round(priceAftercalculated) * 100,
            currency: 'hkd',
            quantity: 1,
          }],
          success_url: `${process.env.DOMIN_TEST}/thank-you?id={CHECKOUT_SESSION_ID}`,
          cancel_url: process.env.DOMIN_TEST,
          customer_email: customerEmail,
          client_reference_id: refId,
          locale: 'en'
        });
        return session.id;
      }
      return 'not good...Something Error';
    });
    return stripeId;
  }
};
