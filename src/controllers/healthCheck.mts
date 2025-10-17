import type { Request, Response } from "express";

export const checkHealth = async (_: Request, res: Response): Promise<void> => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
};
