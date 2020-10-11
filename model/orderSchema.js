const mongoose = require('mongoose');

const { Schema } = mongoose;

module.exports = new Schema({
  status: Number,
  item: [],
  cInfo: {
    name: String,
    phone: String,
    phone2: String,
    email: String,
    delivery_method: Number,
    remark: String,
    delivery_date: String,
    region: String,
    coupon: String,
    address: String,
    address_chi: String,
    floor: Number,
    chooseMyOwnTree: Boolean,
  },
  stripe_ref: String,
  cart_ref: String,
  payment_id: String,
  payment_method: {
    type: Number,
    default: 0
  },
  total_price: Number,
  remark: String,
  invoice_no: {
    type: String,
    default: 'Unknown'
  },
  flag: [],
  create_time: {
    type: Date,
    default: Date.now
  },
  update_time: {
    type: Date,
    default: Date.now
  }
}, { timestamps: { createdAt: 'create_time', updatedAt: 'update_time' } });
