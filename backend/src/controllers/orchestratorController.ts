import { Request, Response } from 'express';
import { orchestratorEngine } from '../services/orchestratorEngine.js';

export const triggerOrchestration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { scenario } = req.body;
    const result = await orchestratorEngine.runOrchestration(id, scenario);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveCustomerPhoto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await orchestratorEngine.resolveUncertaintyWithPhoto(id);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
