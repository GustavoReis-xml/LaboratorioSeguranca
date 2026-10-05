import express from "express";
import userRoutes from "./routes/usuarioRoutes";
import commentRoutes from "./routes/comentarioRoutes";
import hackerMalvadao from "./routes/hackerMalvadaoRoutes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// [MUDANÇA DE SEGURANÇA - COOKIES & JWT]
// No repositório base, não existia cookie-parser.
// Aqui foi adicionado para permitir a leitura e manipulação de cookies HttpOnly e SameSite enviados pelo navegador.
const cookiesParser = require("cookie-parser");
app.use(cookiesParser());

// [MUDANÇA DE SEGURANÇA - JWT]
// Chave secreta usada para assinar e validar os tokens JWT no backend.
(global as any).segredoJwt = "Tnlmaslkcalsdfkalj0129iT";

app.use("/usuario", userRoutes);
app.use("/comentario", commentRoutes);
app.use("/hacker-malvadao", hackerMalvadao);

app.listen(3001, () => {
    console.log("Servidor Vulnerável rodando na porta 3001");
});