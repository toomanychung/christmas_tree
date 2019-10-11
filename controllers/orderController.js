/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
const {
  product, order, cart, delivery, coupon
} = require('../model/main');
const mailController = require('../controllers/mailController');

async function calculateCart(userCart) {
  var errMsg = '';
  if (!userCart) {
    return false;
  }
  let totalPrice = 0;
  let productDetails = await product.find({}, { _id: 0 }, (err, res) => res);
  productDetails = productDetails[0].toObject();
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
      if (quantity < 0) {
        errMsg = 'Quantity not match';
      }
      if (productDetails[item.product][item.size].stock < quantity) {
        errMsg = 'Out of Stock';
      }
      const sumPrice = treePrice * quantity;
      totalPrice += sumPrice;
    }
  });

  console.log(totalPrice);

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
  async createOrder(stripeSession) {
    var flagList = [];
    const cartRef = stripeSession.client_reference_id;
    let productDetails = await product.findOne({}, (err, res) => res);
    productDetails = productDetails.toObject();
    const productObjID = productDetails._id;
    const Relatedcart = await cart.findOne({ _id: cartRef }, { _id: 0 }, (err, res) => res);

    // Add Unit price to order for reference
    const newCartItem = Relatedcart.cart.map((el) => {
      var o = Object.assign({}, el);
      if (el.product !== 'pw') {
        const treePrice = productDetails[el.product][el.size].price;
        const standPrice = productDetails.stand[el.stand].price;
        o.price = treePrice + standPrice;
      } else if (el.product === 'pw') {
        const treePrice = productDetails[el.product][el.size].price;
        const { quantity } = el;
        o.price = treePrice * quantity;
      }
      return o;
    });

    // Deduct stock
    newCartItem.forEach(async (item) => {
      if (item.product !== 'pw') {
        productDetails[item.product][item.size].stock -= 1;
        await product.updateOne({ _id: productObjID }, productDetails);
        productDetails = await product.findOne({}, (err, res) => res);
      } else if (item.product === 'pw') {
        productDetails[item.product][item.size].stock -= parseInt(item.quantity, 10);
        await product.updateOne({ _id: productObjID }, productDetails);
        // const result = await product.updateOne({ _id: productObjID }, productDetails);
        productDetails = await product.findOne({}, (err, res) => res);
      }
    });

    // Check if any choose my own Tree
    newCartItem.forEach((item) => {
      if (item.chooseMyOwnTree) {
        flagList = ['choose-my-own-tree'];
      }
    });

    const orderPayload = {
      status: 0,
      item: newCartItem,
      cInfo: Relatedcart.cInfo,
      cart_ref: cartRef,
      stripe_ref: stripeSession.payment_intent,
      payment_id: stripeSession.id,
      total_price: stripeSession.display_items[0].amount,
      remark: '',
      flag: flagList
    };
    const promise = order.create(orderPayload);
    const result = await promise.then(res => res);
    mailController.sendOrderConfirmationReminder(result.id);
  },
  async createBankInOrder(payload) {
    var flagList = [];
    var error = false;
    // payload including cart & cInfo
    let productDetails = await product.findOne({}, (err, res) => res);
    productDetails = productDetails.toObject();
    const productObjID = productDetails._id;

    // Add Unit price to order for reference
    const newCartItem = payload.cart.map((el) => {
      var o = Object.assign({}, el);
      if (el.product !== 'pw') {
        const treePrice = productDetails[el.product][el.size].price;
        const standPrice = productDetails.stand[el.stand].price;
        o.price = treePrice + standPrice;
      } else if (el.product === 'pw') {
        const treePrice = productDetails[el.product][el.size].price;
        const { quantity } = el;
        o.price = treePrice * quantity;
      }
      return o;
    });

    // Price
    let priceAftercalculated = await calculateCart(payload.cart);
    if (priceAftercalculated === 0) {
      error = true;
    }

    // Deduct stock
    if (!error) {
      newCartItem.forEach(async (item) => {
        if (item.product !== 'pw') {
          productDetails[item.product][item.size].stock -= 1;
          await product.updateOne({ _id: productObjID }, productDetails);
          productDetails = await product.findOne({}, (err, res) => res);
        } else if (item.product === 'pw') {
          productDetails[item.product][item.size].stock -= parseInt(item.quantity, 10);
          await product.updateOne({ _id: productObjID }, productDetails);
          // const result = await product.updateOne({ _id: productObjID }, productDetails);
          productDetails = await product.findOne({}, (err, res) => res);
        }
      });
    }

    // Check if any choose my own Tree
    newCartItem.forEach((item) => {
      if (item.chooseMyOwnTree) {
        flagList = ['choose-my-own-tree'];
      }
    });


    const deliveryMethod = payload.cInfo.delivery_method;
    // Standard Delivery + Floor Charge
    if (deliveryMethod === 1) {
      const deliveryRegion = payload.cInfo.region;
      const floorCharge = payload.cInfo.floor;
      const deliveryPrice = await getDeliveryPrice(deliveryRegion, floorCharge);
      priceAftercalculated += deliveryPrice;
    }
    // Coupon
    if (payload.cInfo.coupon !== '') {
      const couponDetails = await coupon.findOne({ code: payload.cInfo.coupon, valid: true }, { _id: 0 }, (err, res) => res);
      if (couponDetails) {
        const couponValue = couponDetails.discount;
        priceAftercalculated *= 1 - couponValue;
      }
    }

    if (!error) {
      const orderPayload = {
        status: -1,
        item: newCartItem,
        cInfo: payload.cInfo,
        stripe_ref: 'N/A',
        payment_id: 'N/A',
        payment_method: 1,
        total_price: Math.round(priceAftercalculated) * 100,
        remark: '',
        flag: flagList
      };
      const promise = order.create(orderPayload);
      const result = await promise.then(res => res);
      mailController.sendBankInReminder(result.id);
      return result.id;
    }
    return null;
  },
  async qureyOrderByStripeRef(stripeID) {
    const result = order.findOne({ payment_id: stripeID }, (err, res) => res);
    return result;
  },
  async qureyOrderByOrderId(orderId) {
    const result = order.findOne({ _id: orderId }, (err, res) => res);
    return result;
  }
};
