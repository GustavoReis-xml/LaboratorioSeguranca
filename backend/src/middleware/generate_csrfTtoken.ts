import { Request, Response, NextFunction } from "express";
import crypto,{ randomBytes } from "crypto";
import strict from "assert/strict";

// [NOVO ARQUIVO DE SEGURANÇA - TOKEN ANTI-CSRF]
// Este middleware NÃO existia no repositório base.
// Finalidade:
// 1. Gerar um token criptograficamente seguro e aleatório usando a biblioteca 'crypto' (32 bytes em formato hex).
// 2. Gravar o token no cookie com 'sameSite: strict' e 'httpOnly: true' para proteção contra requisições forjadas.
// 3. Disponibilizar o token em res.locals.csrfToken para ser entregue ao frontend (na rota /payload-usuario).

export const generateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
    let csrfToken = req.cookies.csrfToken;
    if (!csrfToken) {
        csrfToken = randomBytes(32).toString('hex');
        res.cookie('csrfToken', csrfToken, {
            httpOnly: true,
            // secure: true, // Habilitar em produção com HTTPS
            sameSite: 'strict'
        });
    }    
    res.locals.csrfToken = csrfToken;
    next();
};