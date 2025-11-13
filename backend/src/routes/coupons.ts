import { Router } from 'express';
import { getCoupons, getCoupon, addCoupon, modifyCoupon, modifyCouponStatus, removeCoupon } from '../controllers/couponController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();
router.get('/', authenticate, requirePermission(Resource.COUPONS, Action.READ), getCoupons);
router.get('/:id', authenticate, requirePermission(Resource.COUPONS, Action.READ), getCoupon);
router.post('/', authenticate, requirePermission(Resource.COUPONS, Action.CREATE), addCoupon);
router.put('/:id', authenticate, requirePermission(Resource.COUPONS, Action.UPDATE), modifyCoupon);
router.patch('/:id/status', authenticate, requirePermission(Resource.COUPONS, Action.UPDATE), modifyCouponStatus);
router.delete('/:id', authenticate, requirePermission(Resource.COUPONS, Action.DELETE), removeCoupon);
export default router;
