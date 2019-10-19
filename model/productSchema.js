const mongoose = require('mongoose');

const { Schema } = mongoose;

module.exports = new Schema({
  _id: Schema.Types.ObjectId,
  nf: {
    '4ft': {
      price: Number,
      stock: Number
    },
    '5ft': {
      price: Number,
      stock: Number
    },
    '6ft': {
      price: Number,
      stock: Number
    },
    '7ft': {
      price: Number,
      stock: Number
    },
    '8ft': {
      price: Number,
      stock: Number
    },
    '9ft': {
      price: Number,
      stock: Number
    },
  },
  df: {
    '4ft': {
      price: Number,
      stock: Number
    },
    '5ft': {
      price: Number,
      stock: Number
    },
    '6ft': {
      price: Number,
      stock: Number
    },
    '7ft': {
      price: Number,
      stock: Number
    },
    '8ft': {
      price: Number,
      stock: Number
    },
    '9ft': {
      price: Number,
      stock: Number
    },
  },
  ff: {
    '5ft': {
      price: Number,
      stock: Number
    },
    '6ft': {
      price: Number,
      stock: Number
    },
    '7ft': {
      price: Number,
      stock: Number
    },
  },
  pw: {
    H5W: {
      name: String,
      price: Number,
      stock: Number
    },
    H9W: {
      name: String,
      price: Number,
      stock: Number
    },
    H12W: {
      name: String,
      price: Number,
      stock: Number
    },
    H5R: {
      name: String,
      price: Number,
      stock: Number
    },
    H9R: {
      name: String,
      price: Number,
      stock: Number
    },
    H12R: {
      name: String,
      price: Number,
      stock: Number
    },
    '12D': {
      name: String,
      price: Number,
      stock: Number
    },
    '20D': {
      name: String,
      price: Number,
      stock: Number
    },
    '24D': {
      name: String,
      price: Number,
      stock: Number
    },
  },
  stand: {
    NA: {
      name: String,
      price: Number,
    },
    C152: {
      name: String,
      price: Number,
    },
    C148: {
      name: String,
      price: Number,
    },
    exchange: {
      name: String,
      price: Number,
    },
    install: {
      name: String,
      price: Number,
    },
  }
});
