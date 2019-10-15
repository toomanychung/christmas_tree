/* eslint-disable no-restricted-globals */
/* eslint-disable no-alert */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
/* eslint-disable vars-on-top */
/* eslint-disable import/extensions */
/* eslint-disable no-unused-vars */
import Vue from 'vue';
import VModal from 'vue-js-modal';
import VueSession from 'vue-session';
import _ from 'lodash';
import Toasted from 'vue-toasted';
import axios from 'axios';
import { extend, ValidationProvider, ValidationObserver } from 'vee-validate';
import { required, email, between } from 'vee-validate/dist/rules';
import VTooltip from 'v-tooltip';

Vue.use(Toasted);
Vue.component('ValidationProvider', ValidationProvider);
Vue.component('ValidationObserver', ValidationObserver);
Vue.config.devtools = true;
Vue.use(VModal);
Vue.use(VueSession);
Vue.use(VTooltip);

extend('required', {
  ...required,
  message: 'This field is required'
});

extend('between', {
  ...between,
  message: 'Please enter a number between 0 and 10'
});

extend('email', {
  ...email,
  message: 'Please provide a valid email address'
});

const stripe = Stripe('pk_test_e94q65F16GIG6KAoQPW0yZ3M');

const defaultDeliveryMethod = [
  {
    name: 'Self Pick-up at nursery',
    value: 0
  },
  {
    name: 'Standard Delivery ($120 for Kowloon, Hong Kong & N.T., $140 for Discovery Bay & Tung Chung)',
    value: 1
  },
];

const treeSizeList = {
  nf: ['4ft', '5ft', '6ft', '7ft', '8ft', '9ft'],
  df: ['5ft', '6ft', '7ft', '8ft', '9ft'],
  ff: ['5ft'],
  pw: []
};

const treePreferenceWidth = ['Wide', 'Average', 'Narrow'];
const treePreferenceHeight = ['Tall', 'Average', 'Fit'];

const defaultSelectedTree = {
  stand: 'NA', widthPreference: 'Average', heightPreference: 'Average', chooseMyOwnTree: false
};

var app = new Vue({
  el: '#main',
  data: {
    isLoading: false,
    selectedTree: _.cloneDeep(defaultSelectedTree),
    defaultDeliveryMethod: _.cloneDeep(defaultDeliveryMethod),
    treeSizeList,
    treePreferenceWidth,
    treePreferenceHeight,
    productDetails: {},
    deliveryDetails: {},
    payment_method: 0,
    acceptPolicy: false,
    cart: [],
    cInfo: {
      name: '', phone: '', email: '', delivery_method: 0, remark: '', delivery_date: '', coupon: ''
    },
    coupon: '',
    coupon_discount: 0
  },
  mounted() {
    this.loadStorage();
    this.loadSetting();
  },
  methods: {
    forceUpdate() {
      const tempTree = this.selectedTree;
      this.selectedTree = {};
      this.selectedTree = tempTree;
      this.$forceUpdate();
      console.log('update', this.selectedTree.quantity);
    },
    loadStorage() {
      const _cart = localStorage.getItem('cart');
      console.log('load Storage', JSON.parse(_cart));
      if (!_.isEmpty(_cart)) {
        this.cart = JSON.parse(_cart);
      }
    },
    loadSetting() {
      this.isLoading = true;
      function getProductDetails() {
        return axios.get('/api/product');
      }
      function getDeliveryDetails() {
        return axios.get('/api/delivery');
      }
      axios.all([getProductDetails(), getDeliveryDetails()])
        .then(axios.spread((productRes, deliveryRes) => {
          this.productDetails = productRes.data;
          this.deliveryDetails = deliveryRes.data;
          this.isLoading = false;
        }));
      if (window.location.pathname === '/thank-you') {
        this.cart = [];
        localStorage.setItem('cart', JSON.stringify(this.cart));
      }
    },
    showProductModal(sku) {
      if (sku === 'pw') {
        this.selectedTree = {};
        this.selectedTree.quantity = 1;
      }
      this.selectedTree.product = sku;
      this.$forceUpdate();
      this.$modal.show('product-modal');
    },
    showCheckOutModal() {
      this.$modal.show('checkout-modal');
    },
    resetSelectedTree() {
      console.log(defaultSelectedTree);
      this.selectedTree = _.cloneDeep(defaultSelectedTree);
    },
    onTreeSizeChange() {
      console.log(`${this.selectedTree.product} - ${this.selectedTree.size}`);
    },
    addToCart() {
      if (this.selectedTree.quantity && this.selectedTree.quantity <= 0) {
        this.$toasted.show('Please adjust the product quantity!', {
          theme: 'bubble',
          position: 'top-center',
          duration: 3000,
          type: 'error'
        });
        this.$modal.hide('product-modal');
        return;
      }
      this.$toasted.show('Product added to cart successfully!', {
        theme: 'bubble',
        position: 'top-center',
        duration: 3000,
        type: 'success'
      });
      this.cart.push(this.selectedTree);
      localStorage.setItem('cart', JSON.stringify(this.cart));
      this.$modal.hide('product-modal');
    },
    deleteItemInCart(index) {
      this.cart.splice(index, 1);
      localStorage.setItem('cart', JSON.stringify(this.cart));
    },
    clearCart() {
      if (confirm('Are you sure to empty the cart?')) {
        this.cart = [];
        localStorage.setItem('cart', JSON.stringify(this.cart));
      }
    },
    goToCart() {
      window.location.href = '/cart';
    },
    goToCheckOut() {
      window.location.href = '/checkout';
    },
    calculateUnitPrice(item) {
      if (item.product !== 'pw') {
        const treePrice = this.productDetails[item.product][item.size].price;
        const standPrice = this.productDetails.stand[item.stand].price;
        return treePrice + standPrice;
      }
      if (item.product === 'pw') {
        const treePrice = this.productDetails[item.product][item.size].price;
        const { quantity } = item;
        return treePrice * quantity;
      }
      return 'N/A';
    },
    calculateTotalPrice() {
      var total = 0;
      _.forEach(this.cart, (item, key) => {
        if (item.product !== 'pw') {
          const treePrice = this.productDetails[item.product][item.size].price;
          const standPrice = this.productDetails.stand[item.stand].price;
          total += treePrice + standPrice;
        } else {
          const treePrice = this.productDetails[item.product][item.size].price;
          const { quantity } = item;
          total += treePrice * quantity;
        }
      });
      return total;
    },
    calculateTotalPriceIncludingDelivery() {
      let price = this.calculateTotalPrice();
      price += this.deliveryCharge;
      price += this.floorCharge;
      // Coupon
      if (this.cInfo.coupon && this.coupon_discount > 0) {
        price *= 1 - this.coupon_discount;
      }
      //
      return Math.round(price);
    },
    formatFlowerName(size) {
      if (this.productDetails) {
        console.log(size);
        const flower = this.productDetails.pw[size];
        return flower.name;
      }
      return 'Unknown';
    },
    async onCheckOut() {
      this.$modal.hide('checkout-modal');
      this.isLoading = true;
      const mergedObj = { cart: this.cart, cInfo: this.cInfo };
      if (parseInt(this.payment_method, 10) === 0) {
        axios.post('/checkout', mergedObj)
          .then((res) => {
            if (res.data === false) {
              console.log('error when stripe!');
              this.cart = [];
              localStorage.setItem('cart', JSON.stringify(this.cart));
              this.isLoading = false;
              return;
            }
            stripe.redirectToCheckout({
              sessionId: res.data
            }).catch((result) => {
              console.log('error when stripe!');
              this.$toasted.show('One of your item in Cart have error, please try again', {
                theme: 'bubble',
                position: 'top-center',
                duration: 3000,
                type: 'error'
              });
              this.cart = [];
              localStorage.setItem('cart', JSON.stringify(this.cart));
              this.isLoading = false;
            });
          });
      } else {
        axios.post('/checkout2', mergedObj)
          .then((res) => {
            const that = this;
            if (!res.data) {
              that.$toasted.show('One of your item in Cart have error, please try again', {
                theme: 'bubble',
                position: 'top-center',
                duration: 3000,
                type: 'error'
              });
              this.cart = [];
              localStorage.setItem('cart', JSON.stringify(this.cart));
            } else {
              window.setTimeout(() => { window.location = `/thank-you?id=${res.data}`; }, 1500);
            }
          })
          .catch((err) => {
            that.$toasted.show('One of your item in Cart have error, please try again', {
              theme: 'bubble',
              position: 'top-center',
              duration: 3000,
              type: 'error'
            });
            this.cart = [];
            localStorage.setItem('cart', JSON.stringify(this.cart));
          })
          .then(() => {
            this.isLoading = false;
          });
      }
    },
    onApplyCoupon() {
      this.isLoading = true;
      axios.post(`/api/coupon?code=${this.coupon}`)
        .then((res) => {
          setTimeout(() => {
            if (res.data.discount) {
              this.coupon_discount = res.data.discount;
              this.cInfo.coupon = res.data.code;
              this.$toasted.show(`${res.data.msg}`, {
                theme: 'bubble',
                position: 'top-center',
                duration: 3000,
                type: 'success'
              });
            } else {
              this.coupon_discount = 0;
              this.cInfo.coupon = '';
              this.$toasted.show(`${res.data.msg}`, {
                theme: 'bubble',
                position: 'top-center',
                duration: 3000,
                type: 'error'
              });
            }
            this.isLoading = false;
          }, 1000);
        })
        .catch((err) => {
          console.log(err);
          this.isLoading = false;
        });
    }
  },
  computed: {
    productPriceSubTotal() {
      if (this.selectedTree.size) {
        if (this.selectedTree.product === 'pw') {
          const treePrice = this.productDetails[this.selectedTree.product][this.selectedTree.size].price;
          const { quantity } = this.selectedTree;
          return treePrice * quantity;
        }
        const treePrice = this.productDetails[this.selectedTree.product][this.selectedTree.size].price;
        const standPrice = this.productDetails.stand[this.selectedTree.stand].price;
        return treePrice + standPrice;
      }
      return '';
    },
    isProductOnStock() {
      if (this.selectedTree.size) {
        const { stock } = this.productDetails[this.selectedTree.product][this.selectedTree.size];
        return stock > 0;
      }
      return false;
    },
    deliveryCharge() {
      if (this.cInfo.region) {
        const region = _.find(this.deliveryDetails, o => o.value === this.cInfo.region);
        return region.price;
      }
      return 0;
    },
    floorCharge() {
      if (this.cInfo.floor) {
        const floorPrice = parseInt(this.cInfo.floor, 10) * 75;
        return floorPrice;
      }
      return 0;
    },
    coupon_discount_amount() {
      if (this.coupon_discount > 0) {
        let price = this.calculateTotalPrice();
        price += this.deliveryCharge;
        price += this.floorCharge;

        return Math.round(price * this.coupon_discount);
      }
      return 0;
    },
    cartItemCount() {
      const itemCount = _.size(this.cart);
      return itemCount;
    },
    selectedRegion() {
      const region = this.deliveryDetails.find(o => o.value === this.cInfo.region);
      return region;
    },
    isQuantityGreaterThanStock() {
      if (this.selectedTree.quantity && this.selectedTree.size) {
        const { stock } = this.productDetails.pw[this.selectedTree.size];
        return stock < this.selectedTree.quantity;
      }
      return false;
    }
  },
  filters: {
    formatCartProductName(sku) {
      switch (sku) {
        case 'nf':
          return 'Noble Fir';
        case 'df':
          return 'Douglas Fir';
        case 'ff':
          return 'Frasier Fir';
        default:
          return 'Unknown';
      }
    },
  }
});
