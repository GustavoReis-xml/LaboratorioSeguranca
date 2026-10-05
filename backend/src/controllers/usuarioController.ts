import { Request, Response } from "express";
import db from "../database";
import jwt from "jsonwebtoken";
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


// [CENÁRIO DE LABORATÓRIO - SQL INJECTION INTENCIONAL]
// Esta função NÃO teve a query parametrizada aplicada.
// Ela mantém a concatenação direta com `${nome}`, `${email}`, `${password}` propositalmente
// para demonstrar em laboratório como um invasor pode burlar a checagem ou injetar comandos SQL.
export const novoLogin = async (req: Request, res: Response) => {
    const { email, password, nome } = req.body;

    const queryNomeIpuExiste =
        `SELECT * FROM iptu WHERE nome = '${nome}'`;

    console.log(`Query Executada: ${queryNomeIpuExiste}`);

    const iptuResult = await db.query(queryNomeIpuExiste);

    if (iptuResult.rowCount && iptuResult.rowCount > 0) {

        const query =
            `INSERT INTO usuario (email, senha, nome, tipo_usuario_id)
             VALUES ('${email}', '${password}', '${nome}', 3)`;

        console.log(`Query Executada: ${query}`);

        const result = await db.query(query);

        const queryIdUsuario =
            `SELECT id FROM usuario
             WHERE email = '${email}' AND senha = '${password}'`;

        console.log(`Query Executada: ${queryIdUsuario}`);

        const resultIdUsuario = await db.query(queryIdUsuario);

        const queryUpdateTabelaIptu =
            `UPDATE iptu
             SET usuario_id = '${resultIdUsuario.rows[0].id}'
             WHERE nome = '${nome}'`;

        console.log(`Query Executada: ${queryUpdateTabelaIptu}`);

        const resultUpdate = await db.query(queryUpdateTabelaIptu);

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
                message: "Falha no login"
            });
        }

    } else {
        res.status(404).json({
            success: false,
            message: `Nome '${nome}' não encontrado no cadastro de municipes`
        });
    }
};


// [CENÁRIO DE LABORATÓRIO - SQL INJECTION INTENCIONAL]
// Embora a rota esteja protegida por authJWT([1]) (apenas Admin), a query em si
// ainda utiliza interpolação de strings `${novoValor}` e `${usuarioId}`, servindo como
// exemplo de vulnerabilidade de injeção em funcionalidades internas/administrativas.
export const atualizarIptu = async (req: Request, res: Response) => {
    const {
        usuarioId,
        novoValor
    } = req.body;

    const query =
        `UPDATE iptu
         SET valor = '${novoValor}'
         WHERE usuario_id = '${usuarioId}'`;

    console.log(`Query Executada: ${query}`);

    try {
        await db.query(query);

        res.json({
            message: "IPTU atualizado"
        });

    } catch (err: any) {
        res.status(500).json({
            error: err.message
        });
    }
};


// [MUDANÇA DE SEGURANÇA - CORREÇÃO DE BROKEN ACCESS CONTROL (IDOR)]
// No repo base: O usuarioId vinha de req.body (enviado pelo cliente).
// Qualquer usuário podia trocar o ID na requisição e ver o IPTU de outro munícipe!
// Atual: O ID é obtido diretamente de res.locals.payload.id (garantido pelo token JWT validado).
export const getIptuPorIdUsuario = async (req: Request, res: Response) => {
    const payload = res.locals.payload;
    const query =
        `SELECT * FROM iptu WHERE usuario_id = '${payload.id}'`;

    console.log(`Query Executada: ${query}`);

    try {

        const result = await db.query(query);

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


// [CENÁRIO DE LABORATÓRIO - REFLECTED XSS INTENCIONAL]
// Esta rota pega o parâmetro da query 'req.query.tipo' e reflete diretamente na resposta HTML:
// <h2>Tipo selecionado: ${tipo}</h2> sem escapar nem sanitizar.
// No frontend, é renderizado usando 'dangerouslySetInnerHTML', permitindo a injeção de scripts (ex: ?tipo=<script>alert(1)</script>).
export const getQRCodeOrCodBarras = async (
    req: Request,
    res: Response
) => {

    const tipo = req.query.tipo as string;


    let codigoHtml = "";

    if (tipo === "codigoDeBarras") {

        codigoHtml =
            `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=123456789" />`;

    } else if (tipo === "qrcode") {

        codigoHtml =
            `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRCodeDemo" />`;
    }

    res.send(`
        <h2>Tipo selecionado: ${tipo}</h2>
        ${codigoHtml}
    `);
};