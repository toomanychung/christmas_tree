/* eslint-disable no-underscore-dangle */
const { Router } = require('express');
const passport = require('passport');
const adminController = require('../controllers/adminController');
const settingController = require('../controllers/settingController');
const couponController = require('../controllers/couponController');
const deliveryController = require('../controllers/deliveryController');

const router = Router();

function authenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/admin/login');
  return null;
}

// router.use((req, res, next) => {
//   console.log(req.path);
//   if (req.path !== '/login') {
//     authenticated(req, res, next);
//     return;
//   }
//   next();
// });

/* Login */
router.get('/login', (req, res) => {
  res.render('admin/login', { layout: false });
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/admin/login');
});

router.post('/login', passport.authenticate('login', {
  successRedirect: '/admin',
  failureRedirect: '/admin/error',
  failureFlash: true
}));

/* Dashboard */
router.get('/', (req, res, next) => {
  res.render('admin/dashboard', { layout: 'admin-layout' });
});

// router.get('/2323', authenticated, (req, res, next) => {
//   res.send('ok');
// });

router.get('/error', (req, res) => {
  res.send('error');
});

/* Order */
router.get('/order', async (req, res, next) => {
  const orderId = req.query.id;
  const order = await adminController.getOrderDetails(orderId);
  if (!order) {
    res.send('Order Not Found');
    return null;
  }
  res.render('admin/order', { layout: 'admin-layout', order });
  return null;
});

/* Product */
router.get('/product', (req, res) => {
  res.render('admin/product', { layout: 'admin-layout' });
});

/* Coupon */
router.get('/coupon', async (req, res) => {
  res.render('admin/coupon', { layout: 'admin-layout' });
});

/* Delivery */
router.get('/delivery', async (req, res) => {
  res.render('admin/delivery', { layout: 'admin-layout' });
});

/* Setting */
router.get('/setting', async (req, res) => {
  const announcement = await settingController.getAnnouncementSetting();
  res.render('admin/setting', { layout: 'admin-layout', announcement });
});

/* Api */
router.get('/api/getOrder', async (req, res) => {
  const params = req.query;
  const result = await adminController.getOrderList(params);
  res.json(result);
});

router.post('/api/editOrder', async (req, res) => {
  const editedOrder = req.body;
  const result = await adminController.updateOrder(editedOrder);
  if (result) {
    res.status(200).send('OK');
    return null;
  }
  res.status(400).send('error');
  return null;
});

router.post('/api/saveProduct', async (req, res) => {
  const editedProduct = req.body;
  const result = await adminController.updateProduct(editedProduct);
  if (result) {
    res.status(200).send('OK');
    return null;
  }
  res.status(400).send('error');
  return null;
});

router.post('/api/editSetting', async (req, res) => {
  const content = req.body;
  const announcementResult = await settingController.changeAnnouncementSetting(content.announcement);
  if (announcementResult === 1) {
    res.status(200).send('OK');
    return null;
  }
  res.status(400).send('error');
  return null;
});

router.get('/api/coupon', async (req, res) => {
  const result = await couponController.getCouponCode();
  res.json(result);
});

router.post('/api/coupon', async (req, res) => {
  const codeList = req.body;
  const result = await couponController.editCouponCode(codeList);
  if (result === null) {
    res.status(400).send('error');
    return null;
  }
  res.status(200).send('OK');
  return null;
});

router.post('/api/delivery', async (req, res) => {
  const deliveryList = req.body;
  const result = await deliveryController.editDelivery(deliveryList);
  if (result === null) {
    res.status(400).send('error');
    return null;
  }
  res.status(200).send('OK');
  return null;
});


/* Test */

router.get('/test-signup', async (req, res) => {
  const msg = await adminController.createAdminAccount();
  res.send(msg);
});

module.exports = router;
