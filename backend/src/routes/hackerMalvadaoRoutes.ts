import { Router } from "express";
import { recepcionarDadosRoubados } from "../controllers/hackerMalvadaoController";

const router = Router();

router.post("/dados-roubados", recepcionarDadosRoubados);

export default router;