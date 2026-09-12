import { Router } from 'express';
import { triggerOrchestration, resolveCustomerPhoto } from '../controllers/orchestratorController.js';

const router = Router();

router.post('/:id/run', triggerOrchestration);
router.post('/:id/resolve-photo', resolveCustomerPhoto);

export default router;