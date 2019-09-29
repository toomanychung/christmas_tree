const mongoose = require('mongoose');

const { Schema } = mongoose;

module.exports = new Schema({
  username: String,
  password: String,
  valid: { type: Boolean, default: true }
});
