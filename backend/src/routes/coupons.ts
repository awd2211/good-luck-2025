import { Router } from 'express';
import { getCoupons, getCoupon, addCoupon, modifyCoupon, modifyCouponStatus, removeCoupon } from '../controllers/couponController';
import { authenticate, requirePermission } from '../middleware/auth';
import { Resource, Action } from '../config/permissions';

const router = Router();
router.get('/', authenticate, requirePermission(Resource.COUPONS, Action.VIEW), getCoupons);
router.get('/:id', authenticate, requirePermission(Resource.COUPONS, Action.VIEW), getCoupon);
router.post('/', authenticate, requirePermission(Resource.COUPONS, Action.CREATE), addCoupon);
router.put('/:id', authenticate, requirePermission(Resource.COUPONS, Action.EDIT), modifyCoupon);
router.patch('/:id/status', authenticate, requirePermission(Resource.COUPONS, Action.EDIT), modifyCouponStatus);
router.delete('/:id', authenticate, requirePermission(Resource.COUPONS, Action.DELETE), removeCoupon);
export default router;
