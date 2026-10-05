import { Request, Response, NextFunction } from "express";

// [NOVO ARQUIVO DE SEGURANÇA - VALIDAÇÃO DE TOKEN ANTI-CSRF]
// Este middleware NÃO existia no repositório base.
// Finalidade:
// 1. Implementar a técnica Double-Submit Cookie contra ataques CSRF.
// 2. Compara o token gravado no cookie do navegador com o token enviado no cabeçalho customizado da requisição.
// 3. Se um site terceiro tentar forjar uma requisição, o navegador enviará o cookie, mas o site invasor
//    não terá acesso ao token para enviar no cabeçalho, sendo barrado com HTTP 403 Forbidden.

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const csrfToken = req.cookies.csrfToken;
    // O Node/Express normaliza cabeçalhos HTTP para minúsculas: 'x-csrf-token'
    const csrfTokenHeader = (req.headers["x-csrf-token"] || req.headers["X-CSRF-Token"]) as string | undefined;

    if (!csrfToken || !csrfTokenHeader || csrfToken !== csrfTokenHeader) {
        return res.status(403).json({
            success: false,
            message: "Token CSRF inválido"
        });
    }

    next();
};