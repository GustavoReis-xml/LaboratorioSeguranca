
import { Request, Response } from "express";
import xss from 'xss';
import db from "../database";



// [MUDANÇAS DE SEGURANÇA - STORED XSS, SQL INJECTION & IDENTIFICAÇÃO SEGURA]
// No repo base:
// 1. `INSERT INTO comentario (texto, usuario_id) VALUES ('${texto}', '${usuarioId}')` -> Vulnerável a SQL Injection!
// 2. Não havia sanitização -> Vulnerável a Stored XSS quando renderizado.
// 3. O 'usuarioId' vinha no body do cliente (podia forjar comentário em nome de outro usuário).
//
// Atual:
// 1. [STORED XSS MITIGADO]: Usa a biblioteca 'xss' para limpar tags maliciosas (<script>, etc.) antes de salvar no banco.
// 2. [SQL INJECTION MITIGADO]: Usa query parametrizada com placeholders $1 e $2.
// 3. [IDENTIDADE SEGURA]: O ID do usuário vem de res.locals.payload.id (garantido pelo middleware authJWT).
export const criarComentario = async (
    req: Request,
    res: Response
) => {
    const {
        texto,
    } = req.body;

    const payload = res.locals.payload;

    // 1. Query parametrizada contra SQL Injection
    const query =
        `INSERT INTO comentario (texto, usuario_id)
         VALUES ($1,$2)`;
    console.log(`Query Executada: ${query}`);

    // 2. Sanitização contra Stored XSS
    const textoLimpo = xss(texto);

    try {
        await db.query(query, [textoLimpo, payload.id]);

        res.status(201).json({
            message: "Comentário criado"
        });

    } catch (err: any) {

        res.status(500).json({
            error: err.message
        });
    }
};


export const listarComentarios = async (
    _req: Request,
    res: Response
) => {

    try {

        const result = await db.query(
            "SELECT * FROM comentario"
        );

        res.json(result.rows);

    } catch (err: any) {

        res.status(500).json({
            error: err.message
        });
    }
};
