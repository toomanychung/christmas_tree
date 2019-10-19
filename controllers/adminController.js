/* eslint-disable no-underscore-dangle */
const bcrypt = require('bcrypt-nodejs');
const dot = require('mongo-dot-notation');
const moment = require('moment');

const { admin, order, product } = require('../model/main');

module.exports = {
  async createAdminAccount() {
    const isAdminAlreadyExist = await admin.findOne({ username: 'admin' }, { _id: 0 }, (err, res) => res);
    if (!isAdminAlreadyExist) {
      const newAdmin = {
        username: 'admin',
        password: bcrypt.hashSync('24567', bcrypt.genSaltSync(10), null)
      };
      admin.create(newAdmin);
      return 'Admin created!';
    }
    return 'Already have admin account';
  },
  async getOrderList(params) {
    const myCustomLabels = {
      totalDocs: 'count',
      docs: 'data',
      limit: 'perPage',
      page: 'currentPage',
      nextPage: 'next',
      prevPage: 'prev',
      totalPages: 'pageCount'
    };
    const options = {
      customLabels: myCustomLabels
    };
    const filters = {};
    //
    if (params.page) {
      options.page = parseInt(params.page, 10);
    }


    if (params.limit) {
      options.limit = params.limit;
    }

    if (params.ascending && params.orderBy) {
      let sortString = params.orderBy;
      if (params.orderBy === 'delivery_date') {
        sortString = 'cInfo.delivery_date';
      }
      if (params.ascending === '0') {
        sortString = `-${sortString}`;
      }
      options.sort = sortString;
    } else {
      options.sort = '-create_time';
    }

    if (params.customFilter) {
      const customQueryParams = JSON.parse(params.customFilter);
      if (customQueryParams.email) {
        filters['cInfo.email'] = { $regex: new RegExp(customQueryParams.email) };
      }
      if (customQueryParams.phone) {
        filters['cInfo.phone'] = customQueryParams.phone;
      }
      if (customQueryParams.status) {
        filters.status = parseInt(customQueryParams.status, 10);
      }
      if (customQueryParams.delivery_method) {
        filters['cInfo.delivery_method'] = parseInt(customQueryParams.delivery_method, 10);
      }
      if (customQueryParams.date) {
        customQueryParams.date = moment(customQueryParams.date).format('YYYY-MM-DD').toString();
        filters['cInfo.delivery_date'] = customQueryParams.date;
      }
    }
    //
    const result = await order.paginate(filters, options, ((err, res) => res));
    return result;
  },
  async getOrderDetails(orderId) {
    if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('ID not match');
      return null;
    }
    const result = await order.findOne({ _id: orderId }, {}, (err, res) => res);
    if (!result) {
      return null;
    }
    return result;
  },
  async updateOrder(editedOrder) {
    const updatedOrder = {
      status: editedOrder.status,
      cInfo: {
        phone: editedOrder.phone,
        phone2: editedOrder.phone2,
        remark: editedOrder.remark_client,
        address: editedOrder.address || '',
        address_chi: editedOrder.address_chi || '',
        delivery_date: editedOrder.delivery_date || '',
      },
      remark: editedOrder.remark_internal
    };
    var dotOrder = dot.flatten(updatedOrder);
    const response = await order.updateOne({ _id: editedOrder._id }, dotOrder, (err, res) => res);
    return response.ok;
  },
  async updateProduct(editedProduct) {
    var dotOrder = dot.flatten(editedProduct);
    const response = await product.updateOne({}, dotOrder, (err, res) => res);
    return response.ok;
  }
};
