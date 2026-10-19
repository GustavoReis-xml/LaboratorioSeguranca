import { Request, Response } from "express";
import db from "../database";
import jwt from "jsonwebtoken";
import xss from "xss";
import ValidarToken from "../Services/jwtServices";


// [MUDANÇA DE SEGURANÇA - ENTREGA SEGURA DE DADOS DE SESSÃO]
// No repo base: Os dados do usuário eram salvos em texto claro no localStorage do navegador.
// Atual: O frontend busca os dados do payload validado pelo JWT (res.locals.payload)
// e recebe também o token anti-CSRF gerado pelo servidor, sem expor dados sensíveis como senhas.
export const payloadUsuario = async (req: Request, res: Response) => {
    return res.json({
        success: true,
        message: "Payload do usuário obtido com sucesso",
        payload: res.locals.payload,
        csrfToken: res.locals.csrfToken
    });
};


// [MUDANÇA DE SEGURANÇA - SQL INJECTION, JWT & COOKIES SEGUROS]
// 1. [SQL INJECTION CORRIGIDO]:
//    No repo base: `SELECT * FROM usuario WHERE email = '${email}' AND senha = '${password}'` (vulnerável a ' OR 1=1 --)
//    Atual: Usa query parametrizada `$1` e `$2` com array de parâmetros [email, password].
// 2. [JWT & DADOS SENSÍVEIS]:
//    O token assina apenas dados não sensíveis (id, nome, email, tipo). A senha NUNCA é colocada no JWT.
// 3. [COOKIES & CSRF/XSS]:
//    O token não é devolvido em JSON para salvar em localStorage. Ele é enviado em um Cookie com:
//    - httpOnly: true (impede roubo do token via scripts JavaScript/XSS).
//    - sameSite: "strict" (impede envio do cookie em requisições forjadas entre sites/CSRF).
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    // Query parametrizada que previne SQL Injection
    const query =
        `SELECT * FROM usuario WHERE email = $1 AND senha = $2`;

    console.log(`Query Executada: ${query}`);

    const result = await db.query(query, [email, password]);

    if (result.rowCount && result.rowCount > 0) {
        const token = jwt.sign(
            {
                id: result.rows[0].id,
                nome: result.rows[0].nome,
                email: result.rows[0].email,
                tipo: result.rows[0].tipo_usuario_id
            }, (global as any).segredoJwt);

        // Cookie com proteção HttpOnly e SameSite
        res.cookie("token", token, { httpOnly: true, sameSite:"strict" });

        res.json({
            success: true,
            csrfToken: res.locals.csrfToken
        });

    } else {
        res.status(401).json({
            success: false,
            message: "Falha no login"
        });
    }
};


// [MUDANÇA DE SEGURANÇA - SQL INJECTION CORRIGIDO]
// Como era antes (vulnerável a SQL Injection por concatenação de strings):
// const queryNomeIpuExiste = `SELECT * FROM iptu WHERE nome = '${nome}'`;
// const query = `INSERT INTO usuario (email, senha, nome, tipo_usuario_id) VALUES ('${email}', '${password}', '${nome}', 3)`;
// const queryIdUsuario = `SELECT id FROM usuario WHERE email = '${email}' AND senha = '${password}'`;
// const queryUpdateTabelaIptu = `UPDATE iptu SET usuario_id = '${resultIdUsuario.rows[0].id}' WHERE nome = '${nome}'`;
//
// Como foi corrigido:
// Todas as queries foram parametrizadas utilizando placeholders ($1, $2, $3) e array de parâmetros no Pool.
export const novoLogin = async (req: Request, res: Response) => {
    const { email, password, nome } = req.body;

    const queryNomeIpuExiste = `SELECT * FROM iptu WHERE nome = $1`;
    console.log(`Query Executada: ${queryNomeIpuExiste}`);

    const iptuResult = await db.query(queryNomeIpuExiste, [nome]);

    if (iptuResult.rowCount && iptuResult.rowCount > 0) {

        const query =
            `INSERT INTO usuario (email, senha, nome, tipo_usuario_id)
             VALUES ($1, $2, $3, 3) RETURNING id`;

        console.log(`Query Executada: ${query}`);

        const result = await db.query(query, [email, password, nome]);
        const idUsuario = result.rows[0].id;

        const queryUpdateTabelaIptu =
            `UPDATE iptu
             SET usuario_id = $1
             WHERE nome = $2`;

        console.log(`Query Executada: ${queryUpdateTabelaIptu}`);

        const resultUpdate = await db.query(queryUpdateTabelaIptu, [idUsuario, nome]);

        if (
            result.rowCount &&
            result.rowCount > 0 &&
            resultUpdate.rowCount &&
            resultUpdate.rowCount > 0
        ) {

            res.json({
                success: true,
                user: result.rows[0]
            });

        } else {
            res.status(401).json({
                success: false,
                message: "Falha no cadastro"
            });
        }

    } else {
        res.status(404).json({
            success: false,
            message: `Nome '${nome}' não encontrado no cadastro de municipes`
        });
    }
};


// [MUDANÇA DE SEGURANÇA - SQL INJECTION CORRIGIDO]
// Como era antes (vulnerável a SQL Injection por concatenação):
// const query = `UPDATE iptu SET valor = '${novoValor}' WHERE usuario_id = '${usuarioId}'`;
// await db.query(query);
//
// Como foi corrigido:
// Query parametrizada com placeholders $1 e $2, impedindo qualquer injeção de SQL.
export const atualizarIptu = async (req: Request, res: Response) => {
    const {
        usuarioId,
        novoValor
    } = req.body;

    const query =
        `UPDATE iptu
         SET valor = $1
         WHERE usuario_id = $2`;

    console.log(`Query Executada: ${query}`);

    try {
        await db.query(query, [novoValor, usuarioId]);

        res.json({
            message: "IPTU atualizado"
        });

    } catch (err: any) {
        res.status(500).json({
            error: err.message
        });
    }
};


// [MUDANÇA DE SEGURANÇA - BROKEN ACCESS CONTROL & SQL INJECTION CORRIGIDOS]
// Como era antes:
// 1. O usuarioId vinha de req.body (cliente podia adulterar o ID e ver dados de outros municípes - IDOR).
// 2. Query interpolada: `SELECT * FROM iptu WHERE usuario_id = '${usuarioId}'`.
//
// Como foi corrigido:
// 1. O ID é obtido de res.locals.payload.id (garantido pelo token JWT assinado).
// 2. Query parametrizada com placeholder $1.
export const getIptuPorIdUsuario = async (req: Request, res: Response) => {
    const payload = res.locals.payload;
    const query =
        `SELECT * FROM iptu WHERE usuario_id = $1`;

    console.log(`Query Executada: ${query}`);

    try {

        const result = await db.query(query, [payload.id]);

        console.log(`Retorno: ${JSON.stringify(result.rows)}`);

        res.json({
            iptu: result.rows
        });

    } catch (err: any) {

        res.status(500).json({
            error: err.message
        });
    }
};


export const getIptus = async (
    req: Request,
    res: Response
) => {

    
    const query = `SELECT * FROM iptu`;

    console.log(`Query Executada: ${query}`);

    try {

        const result = await db.query(query);

        res.json({
            iptu: result.rows
        });

    } catch (err: any) {

        res.status(500).json({
            error: err.message
        });
    }
};


// [MUDANÇA DE SEGURANÇA - REFLECTED XSS CORRIGIDO]
// Como era antes (vulnerável a Reflected XSS):
// const tipo = req.query.tipo as string;
// res.send(`<h2>Tipo selecionado: ${tipo}</h2>${codigoHtml}`);
// -> O parâmetro 'tipo' era refletido sem sanitização diretamente no HTML.
//
// Como foi corrigido:
// 1. Sanitização de entrada com a biblioteca 'xss'.
// 2. Resposta em formato estruturado (JSON) com { tipo, urlImagem },
//    permitindo ao frontend renderizar com tags seguras do React sem dangerouslySetInnerHTML.
export const getQRCodeOrCodBarras = async (
    req: Request,
    res: Response
) => {
    const tipoBruto = (req.query.tipo as string) || "";
    // Sanitização com a biblioteca xss
    const tipoSanitizado = xss(tipoBruto);

    let urlImagem = "";
    if (tipoSanitizado === "codigoDeBarras") {
        urlImagem = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=123456789";
    } else if (tipoSanitizado === "qrcode") {
        urlImagem = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRCodeDemo";
    }

    res.json({
        tipo: tipoSanitizado,
        urlImagem
    });
};