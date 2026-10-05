import jwt from "jsonwebtoken";
import { RetornoPayload } from "../Tipos/retornoPayload";

// [MUDANÇA DE SEGURANÇA - VALIDAÇÃO CRIPTOGRÁFICA DO JWT]
// Utiliza a chave secreta do servidor para verificar se o token foi realmente emitido
// pelo nosso backend e se não sofreu nenhuma alteração no payload.
export default function ValidarToken(token: string): RetornoPayload | null {
    try {
        console.log("Token: ",token);
        console.log("Tipo: ", typeof token);
        console.log("Tamanho: ",token.length);
        console.log("Primeiro caractere: ",token[0]);
        console.log("Ultimo caractere: ",token[token.length -1]);
        const decoded = jwt.verify(token, (global as any).segredoJwt) as RetornoPayload;
        return {
            id: decoded.id,
            tipo: decoded.tipo,
            email: decoded.email,
            nome: decoded.nome
        };
    } catch (error) {
        console.error("erro ao validar o token",error)
        return null;
    }
}


