const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const mongoDB = process.env.DB_URL;
mongoose.set('useNewUrlParser', true);
mongoose.connect(mongoDB, { dbName: 'main', useNewUrlParser: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const productSchema = require('./productSchema');
const deliverySchema = require('./deliverySchema');
const cartSchema = require('./cartSchema');
const couponSchema = require('./couponSchema');
const orderSchema = require('./orderSchema');
const adminSchema = require('./adminSchema');
const settingSchema = require('./settingSchema');

orderSchema.plugin(mongoosePaginate);

const product = mongoose.model('products', productSchema);
const delivery = mongoose.model('deliverys', deliverySchema);
const cart = mongoose.model('carts', cartSchema);
const coupon = mongoose.model('coupons', couponSchema);
const order = mongoose.model('orders', orderSchema);
const admin = mongoose.model('admins', adminSchema);
const setting = mongoose.model('settings', settingSchema);


module.exports = {
  product,
  delivery,
  cart,
  coupon,
  order,
  admin,
  setting
};
