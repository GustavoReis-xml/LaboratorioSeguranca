import { Router } from "express";
import { criarComentario, listarComentarios } from "../controllers/comentarioController";
import { verifyToken } from "../middleware/verify_csrfToken";
import { authJWT } from "../middleware/authJWT";

const router = Router();

// [MUDANÇAS DE SEGURANÇA - ANTI-CSRF E JWT]
// No repo base: router.post("/", criarComentario) - aberto e sem proteção CSRF!
// Atual:
// 1. verifyToken: Valida o token anti-CSRF enviado pelo header para evitar requisições forjadas.
// 2. authJWT: Garante que apenas usuários autenticados possam postar comentários e identifica o autor via token.
router.post("/", verifyToken, authJWT, criarComentario);

// [MUDANÇA DE SEGURANÇA - JWT]
// Apenas usuários logados podem listar comentários.
router.get("/", authJWT, listarComentarios);

export default router;