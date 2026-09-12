import { Router } from 'express';
import {
  getClaims,
  getClaimById,
  createClaim,
  updateClaim,
  adjudicateClaim,
  processSettlement,
  getKpis,
  resetClaims
} from '../controllers/claimsController.js';

const router = Router();

router.get('/', getClaims);
router.get('/kpis', getKpis);
router.post('/reset', resetClaims);
router.get('/:id', getClaimById);
router.post('/', createClaim);
router.put('/:id', updateClaim);
router.post('/:id/adjudicate', adjudicateClaim);
router.post('/:id/settle', processSettlement);

export default router;