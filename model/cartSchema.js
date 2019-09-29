const mongoose = require('mongoose');

const { Schema } = mongoose;

module.exports = new Schema({
  cart: [],
  cInfo: {
    name: String,
    phone: String,
    email: String,
    delivery_method: Number,
    remark: String,
    delivery_date: String,
    region: String,
    coupon: String,
    address: String,
    floor: Number,
  },
  create_time: {
    type: Date,
    default: Date.now
  },
  update_time: {
    type: Date,
    default: Date.now
  }
}, { timestamps: { createdAt: 'create_time', updatedAt: 'update_time' } });
