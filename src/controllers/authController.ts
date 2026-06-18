import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }
    const data = await authService.register(email, password);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }
    const data = await authService.login(email, password);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await authService.deleteAccount(userId as string);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const result = await authService.logout();
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
