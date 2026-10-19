import { Router } from "express";
import { login, atualizarIptu, payloadUsuario, novoLogin, getIptuPorIdUsuario, getQRCodeOrCodBarras, getIptus } from "../controllers/usuarioController";
import { generateCSRFToken } from "../middleware/generate_csrfTtoken";
import { verifyToken } from "../middleware/verify_csrfToken";
import { authJWT } from "../middleware/authJWT";

const router = Router();

// Rota de login: Autentica o usuário e gera cookie JWT com HttpOnly e SameSite
router.post("/login", login);

// [MUDANÇA DE SEGURANÇA - SQL INJECTION CORRIGIDO]
// Como era antes: Rota vulnerável a injeção SQL no cadastro de novos usuários por concatenação de strings.
// Como foi corrigido: A controller 'novoLogin' agora utiliza queries preparadas/parametrizadas com placeholders ($1, $2, $3).
router.post("/novo-login", novoLogin);

// [MUDANÇAS DE SEGURANÇA - CONTROLE DE ACESSO & TOKEN ANTI-CSRF]
// Como era antes: router.post("/atualizar-iptu", atualizarIptu) - aberta a qualquer usuário e sem validação CSRF!
// Como foi corrigido:
// 1. verifyToken: Garante que a requisição mutante contenha o token anti-CSRF válido.
// 2. authJWT([1]): Permite apenas Administradores autenticados (perfil tipo 1).
router.put("/atualizar-iptu", verifyToken, authJWT([1]), atualizarIptu);

// [MUDANÇA DE SEGURANÇA - AUTENTICAÇÃO JWT & IDOR]
// Como era antes: O usuarioId vinha no body enviado pelo cliente (vulnerável a IDOR).
// Como foi corrigido: Rota protegida por authJWT, obtendo o ID do usuário diretamente do payload do token.
router.get("/iptu-por-usuario", authJWT, getIptuPorIdUsuario);

// [MUDANÇA DE SEGURANÇA - REFLECTED XSS CORRIGIDO & JWT]
// Como era antes: Parâmetro 'tipo' da URL era concatenado diretamente em HTML retornado.
// Como foi corrigido: Protegida por authJWT e parâmetro sanitizado com a biblioteca 'xss'.
router.get("/codigo-qr-ou-barra", authJWT, getQRCodeOrCodBarras);

// Rota de listagem geral de IPTUs protegida por autenticação JWT
router.get("/iptus", authJWT, getIptus);

// [MUDANÇA DE SEGURANÇA - PAYLOAD SEGURO & TOKEN ANTI-CSRF]
// Rota criada para entregar os dados do usuário autenticado e o token CSRF de forma segura ao frontend.
router.get("/payload-usuario", generateCSRFToken, authJWT, payloadUsuario);

export default router;