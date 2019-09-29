const mongoose = require('mongoose');

const { Schema } = mongoose;

module.exports = new Schema({
  _id: Schema.Types.ObjectId,
  code: {
    type: String,
    required: true,
    unique: true
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  valid: Boolean
});
