import { Router } from "express";
import { login, atualizarIptu, payloadUsuario, novoLogin, getIptuPorIdUsuario, getQRCodeOrCodBarras, getIptus } from "../controllers/usuarioController";
import { generateCSRFToken } from "../middleware/generate_csrfTtoken";
import { verifyToken } from "../middleware/verify_csrfToken";
import { authJWT } from "../middleware/authJWT";

const router = Router();

// Rota de login: Autentica o usuário e gera cookie JWT com HttpOnly e SameSite
router.post("/login", login);

// [CENÁRIO DE LABORATÓRIO]: Rota de cadastro mantida com queries concatenadas para demonstração didática de SQL Injection
router.post("/novo-login", novoLogin);

// [MUDANÇA DE SEGURANÇA - CONTROLE DE ACESSO (BROKEN ACCESS CONTROL)]
// No repo base: router.post("/atualizar-iptu", atualizarIptu) - qualquer um podia atualizar!
// Atual: Alterado para PUT e protegido por authJWT([1]), permitindo apenas Administradores (perfil tipo 1).
router.put("/atualizar-iptu", authJWT([1]), atualizarIptu);

// [MUDANÇA DE SEGURANÇA - AUTENTICAÇÃO JWT]
// No repo base: O usuarioId vinha no body enviado pelo cliente (inseguro).
// Atual: Rota protegida por authJWT, garantindo que o usuário só consiga consultar os dados da sua própria sessão.
router.get("/iptu-por-usuario", authJWT, getIptuPorIdUsuario);

// [CENÁRIO DE LABORATÓRIO]: Rota protegida por JWT, mas vulnerável a Reflected XSS no parâmetro 'tipo'
router.get("/codigo-qr-ou-barra", authJWT, getQRCodeOrCodBarras);

// Rota de listagem geral de IPTUs protegida por autenticação JWT
router.get("/iptus", authJWT, getIptus);

// [MUDANÇA DE SEGURANÇA - PAYLOAD SEGURO & TOKEN ANTI-CSRF]
// Rota criada para entregar os dados do usuário autenticado e o token CSRF de forma segura ao frontend.
router.get("/payload-usuario", generateCSRFToken, authJWT, payloadUsuario);

export default router;