import { Request, Response } from 'express';
import { claimsEngine } from '../services/claimsEngine.js';
import { ClaimStatus } from '../types/claims.js';

export const getClaims = (req: Request, res: Response) => {
  try {
    const status = req.query.status as ClaimStatus | undefined;
    const claims = claimsEngine.getAllClaims(status);
    res.json({ success: true, count: claims.length, data: claims });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClaimById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const claim = claimsEngine.getClaimById(id);
    if (!claim) {
      return res.status(404).json({ success: false, message: `Claim ${id} not found` });
    }
    res.json({ success: true, data: claim });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createClaim = (req: Request, res: Response) => {
  try {
    const claim = claimsEngine.createClaim(req.body);
    res.status(201).json({ success: true, data: claim });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateClaim = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = claimsEngine.updateClaim(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Claim ${id} not found` });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const adjudicateClaim = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, notes, customAmount } = req.body;
    if (!decision || !['Approved', 'Rejected', 'Requested_Info'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Valid decision required' });
    }
    const updated = claimsEngine.adjudicateClaim(id, decision, notes || '', customAmount);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Claim ${id} not found` });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processSettlement = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const settled = claimsEngine.processSettlement(id);
    if (!settled) {
      return res.status(404).json({ success: false, message: `Claim ${id} not found` });
    }
    res.json({ success: true, data: settled });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getKpis = (req: Request, res: Response) => {
  try {
    const kpis = claimsEngine.getKpis();
    res.json({ success: true, data: kpis });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetClaims = (req: Request, res: Response) => {
  try {
    claimsEngine.resetToDefaults();
    res.json({ success: true, message: 'All demo claims reset to default state' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
