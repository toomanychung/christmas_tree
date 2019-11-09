/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable vars-on-top */
import Vue from 'vue';
import _ from 'lodash';
import axios from 'axios';
import { ServerTable, Event } from 'vue-tables-2';
import moment from 'moment';
import Toasted from 'vue-toasted';
import { Tabs, Tab } from 'vue-slim-tabs';
import Datepicker from 'vuejs-datepicker';

Vue.config.devtools = true;
Vue.use(ServerTable);
Vue.use(Toasted);

var app = new Vue({
  el: '#main-admin',
  components: {
    Tabs, Tab, Datepicker
  },
  data: {
    isMenuToggle: false,
    isLoading: false,
    filters: {},
    productDetails: {},
    deliveryDetails: {},
    coupon: {},
    tempOrderVue: {},
    orderProductTypeOptions: [
      { text: 'Noble Fir', value: 'nf' },
      { text: 'Fraser Fir', value: 'ff' },
      { text: 'Douglas Fir', value: 'df' },
      { text: 'Poinsettia / Wreath', value: 'pw' },
    ],
    orderProductSizeOptions: [
      '4ft',
      '5ft',
      '6ft',
      '7ft',
      '8ft',
      '9ft'
    ],
    orderProductPwSizeOptions: [
      { text: 'Poinsettia 1 H 5" Pot (White)', value: 'H5W' },
      { text: 'Poinsettia 2 H 9" Pot (White)', value: 'H9W' },
      { text: 'Poinsettia 3 H 12" Pot (White)', value: 'H12W' },
      { text: 'Poinsettia 1 H 5" Pot (Red)', value: 'H5R' },
      { text: 'Poinsettia 2 H 9" Pot (Red)', value: 'H9R' },
      { text: 'Poinsettia 3 H 12" Pot (Red)', value: 'H12R' },
      { text: '12" Diametre Wreath', value: '12D' },
      { text: '20" Diametre Wreath', value: '20D' },
      { text: '24" Diametre Wreath', value: '24D' },
    ],
    orderProductStandOptions: [
      { text: 'No stand and installation need', value: 'NA' },
      { text: 'C152 Stand', value: 'C152' },
      { text: 'C148 Stand', value: 'C148' },
      { text: 'Exchange', value: 'exchange' },
      { text: 'Installation at delivery', value: 'install' },
    ],
    options: {
      requestFunction(params) {
        return axios.get('admin/api/getOrder', {
          params
        }).catch((e) => {
          this.dispatch('error', e);
        });
      },
      responseAdapter(res) {
        if (!res || !res.data) {
          return { data: [], count: 0 };
        }
        return {
          data: _.map(res.data.data, i => _.extend(i, { check: false })),
          count: res.data.count
        };
      },
      sortIcon: {
        base: 'fa', up: 'fa-chevron-up', down: 'fa-chevron-down', is: 'fa-sort'
      },
      sortable: ['status', 'create_time', 'delivery_date', 'total_price'],
      customFilters: ['customFilter'],
      filterable: false,
      perPage: 25,
      perPageValues: [10, 15, 25, 50, 100, 500]
    },
    columns: ['_id', 'email', 'status', 'create_time', 'phone', 'delivery_method', 'delivery_date', 'region', 'total_price', 'remark'],
  },
  mounted() {
    this.loadSetting();
  },
  methods: {
    loadSetting() {
      this.isLoading = true;
      function getProductDetails() {
        return axios.get('/api/product');
      }
      function getDeliveryDetails() {
        return axios.get('/api/delivery');
      }
      if (window.tempOrder) {
        this.tempOrderVue = _.cloneDeep(window.tempOrder);
        this.$forceUpdate();
      }
      if (window.location.pathname === '/admin/product') {
        axios.all([getProductDetails(), getDeliveryDetails()])
          .then(axios.spread((productRes, deliveryRes) => {
            this.productDetails = productRes.data;
            this.deliveryDetails = deliveryRes.data;
            this.isLoading = false;
          }));
      } else if (window.location.pathname === '/admin/coupon') {
        axios.get('/admin/api/coupon')
          .then((res) => {
            this.coupon = res.data;
            this.isLoading = false;
          });
      } else if (window.location.pathname === '/admin/delivery') {
        axios.get('/api/delivery')
          .then((res) => {
            this.deliveryDetails = res.data;
            this.isLoading = false;
          });
      } else {
        this.isLoading = false;
      }
    },
    close() {
      window.close();
    },
    onToggleMenu() {
      this.isMenuToggle = !this.isMenuToggle;
    },
    onApplyFilter() {
      const params = this.filters;
      Event.$emit('vue-tables.filter::customFilter', JSON.stringify(params));
    },
    onResetFilter() {
      this.filters = {};
      this.onApplyFilter();
    },
    onRequestReport() {
      const params = this.filters;
      const u = JSON.stringify(params);
      const url = `./admin/api/getOrder?customFilter=${u}&query=&limit=9999&excel=true`;
      window.open(url);
    },
    onSaveOrder() {
      this.isLoading = true;
      const editedOrder = {};
      editedOrder._id = document.getElementById('order_id').innerHTML;
      editedOrder.status = document.getElementById('status').value;
      editedOrder.phone = document.getElementById('phone').value;
      editedOrder.phone2 = document.getElementById('phone2').value;
      if (parseInt(document.getElementById('delivery_method').value, 10) !== 0) {
        editedOrder.delivery_date = document.getElementById('delivery_date').value;
        editedOrder.address = document.getElementById('address').value;
        editedOrder.address_chi = document.getElementById('address_chi').value;
        editedOrder.region = document.getElementById('delivery_region').value;
      }
      editedOrder.remark_client = document.getElementById('remark_client').value;
      editedOrder.remark_internal = document.getElementById('remark_internal').value;
      editedOrder.item = this.tempOrderVue.item;
      axios.post('/admin/api/editOrder', editedOrder)
        .then((res) => {
          this.$toasted.show('Update Order success!', {
            theme: 'bubble',
            position: 'top-center',
            duration: 3000,
            type: 'success'
          });
        })
        .catch((error) => {
          this.$toasted.show('Error when update!', {
            theme: 'bubble',
            position: 'top-center',
            duration: 3000,
            type: 'error'
          });
        })
        .then(() => {
          setTimeout(() => { this.isLoading = false; }, 1000);
        });
    },
    onProductSave() {
      this.isLoading = true;
      const product = this.productDetails;
      axios.post('/admin/api/saveProduct', product)
        .then((res) => {
          this.$toasted.show('Update Product success!', {
            theme: 'bubble',
            position: 'top-center',
            duration: 3000,
            type: 'success'
          });
        })
        .catch((error) => {
          this.$toasted.show('Error when update!', {
            theme: 'bubble',
            position: 'top-center',
            duration: 3000,
            type: 'error'
          });
        })
        .then(() => {
          // eslint-disable-next-line no-restricted-globals
          setTimeout(() => { location.reload(); }, 1000);
        });
    },
    onAddItem() {
      const emptyItem = {
        product: 'nf',
        size: '4ft',
        stand: 'NA',
        price: 0,
      };
      this.tempOrderVue.item.push(emptyItem);
    },
    onDeleteOrderItem(index) {
      this.tempOrderVue.item.splice(index, 1);
    },
    onSettingSubmit() {
      const content = {};
      const announcement = document.querySelector('#announcement').value;
      content.announcement = announcement;
      axios.post('/admin/api/editSetting', content)
        .then((res) => {
          this.$toasted.show('Update Setting success!', {
            theme: 'bubble',
            position: 'top-center',
            duration: 3000,
            type: 'success'
          });
        })
        .catch((error) => {
          this.$toasted.show('Error when update!', {
            theme: 'bubble',
            position: 'top-center',
            duration: 3000,
            type: 'error'
          });
        })
        .then(() => {
          // eslint-disable-next-line no-restricted-globals
          setTimeout(() => { location.reload(); }, 1000);
        });
    },
    onAddCoupon() {
      const newEmptyCoupon = {
        code: '',
        discount: 0.05,
        valid: true
      };
      this.coupon.push(newEmptyCoupon);
    },
    onCouponSubmit() {
      var error = false;
      const { coupon } = this;
      this.isLoading = true;
      coupon.forEach((item) => {
        if (item.code === '' || item.discount === '') {
          error = true;
        }
      });
      if (error) {
        alert('Code or Discount cant be empty');
      } else {
        axios.post('/admin/api/coupon', coupon)
          .then((res) => {
            this.$toasted.show('Update Setting success!', {
              theme: 'bubble',
              position: 'top-center',
              duration: 3000,
              type: 'success'
            });
          })
          .catch(() => {
            this.$toasted.show('Error when update! Make sure all the amount is small than 1, and no duplicated code allowed', {
              theme: 'bubble',
              position: 'top-center',
              duration: 3000,
              type: 'error'
            });
          })
          .then(() => {
            // eslint-disable-next-line no-restricted-globals
            setTimeout(() => { location.reload(); }, 1000);
          });
      }
    },
    onAddDeliveryDate(value) {
      const res = _.find(this.deliveryDetails, { value });
      const newDate = '';
      if (res.date[res.date.length - 1] !== '') {
        res.date.push(newDate);
      }
    },
    onDeleteDeliveryDate(value, index) {
      const res = _.find(this.deliveryDetails, { value });
      res.date.splice(index, 1);
    },
    onSaveDelivery() {
      this.isLoading = true;
      axios.post('/admin/api/delivery', this.deliveryDetails)
        .then((res) => {
          this.$toasted.show('Update Delivery success!', {
            theme: 'bubble',
            position: 'top-center',
            duration: 3000,
            type: 'success'
          });
        })
        .catch(() => {
          this.$toasted.show('Error when update! Make sure all the date is formatly correct.', {
            theme: 'bubble',
            position: 'top-center',
            duration: 3000,
            type: 'error'
          });
        })
        .then(() => {
          // eslint-disable-next-line no-restricted-globals
          setTimeout(() => { location.reload(); }, 1000);
        });
    }
  },
  filters: {
    formatDate(date) {
      return moment(date).format('YYYY-MM-DD HH:mm');
    },
    formatPrice(price) {
      return parseInt(price, 10) / 100;
    },
    formatDeliveryMethod(deliveryMethod) {
      switch (+deliveryMethod) {
        case 0:
          return 'Self-Pickup';
        case 1:
          return 'Standard Delivery';
        default:
          return deliveryMethod;
      }
    },
    formatStatus(status) {
      switch (+status) {
        case -3:
          return 'Refunded';
        case -2:
          return 'Cancelled';
        case -1:
          return 'Waiting';
        case 0:
          return 'Pending';
        case 1:
          return 'Deliverying';
        case 2:
          return 'Complete';
        default:
          return status;
      }
    }
  }
});
