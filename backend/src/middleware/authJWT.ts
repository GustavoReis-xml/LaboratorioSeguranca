import { Request, Response, NextFunction } from "express";
import ValidarToken from "../Services/jwtServices";

// [NOVO ARQUIVO DE SEGURANÇA - JWT & CONTROLE DE ACESSO (BROKEN ACCESS CONTROL)]
// Este middleware NÃO existia no repositório base.
// Finalidade:
// 1. Obter o token JWT diretamente do cookie seguro (HttpOnly).
// 2. Validar a integridade e assinatura do token com o segredo do servidor.
// 3. Implementar RBAC (Role-Based Access Control) verificando o perfil (tipo) do usuário.
// 4. Injetar o payload validado em res.locals.payload para uso seguro nas controllers.

function execAuth(tipoUsuario: number[] | undefined, req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token não fornecido",
        });
    }

    const payload = ValidarToken(token);
    if (!payload) {
        return res.status(401).json({
            success: false,
            message: "Token inválido"
        });
    }

    // Validação de nível de acesso (evita Broken Access Control)
    if (Array.isArray(tipoUsuario) && !tipoUsuario.includes(payload.tipo)) {
        return res.status(403).json({
            success: false,
            message: "acesso negado"
        });
    }

    res.locals.payload = payload;
    next();
}

export function authJWT(arg?: any, resParam?: Response, nextParam?: NextFunction): any {
    // Se for chamado diretamente como middleware pelo Express: router.get('/...', authJWT, ...)
    if (arg && arg.cookies && resParam && nextParam) {
        return execAuth(undefined, arg as Request, resParam, nextParam);
    }

    // Se for chamado como factory com array de perfis: authJWT([1])
    return (req: Request, res: Response, next: NextFunction) => {
        return execAuth(arg, req, res, next);
    };
}