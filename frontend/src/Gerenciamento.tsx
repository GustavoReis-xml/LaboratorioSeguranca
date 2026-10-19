import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Iptuu } from "./Tipos/Iptuu";

function Gerenciamento() {
    const navigate = useNavigate();

  const [user, setUser] = useState<{
    id: number;
    nome: string;
    email: string;
    tipo: number;
  } | null>(null);

  const [iptus, setIptus] = useState<Iptuu[]>([]);
  const [novoValor, setNovoValor] = useState<{ [key: number]: number }>({});
  const [menuAberto, setMenuAberto] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");


  useEffect(() => {

    const buscarDados = async () => {

      try {
        // [MUDANÇA DE SEGURANÇA - CONTROLE DE ACESSO & TOKEN ANTI-CSRF NO FRONTEND]
        // Como era antes: Lia usuário do localStorage sem validação real com o servidor.
        // Como foi corrigido: Valida a sessão via /usuario/payload-usuario com cookies HttpOnly
        // e recebe o token anti-CSRF para requisições de alteração.
        // Se a resposta for 403 (Forbidden), o usuário sem privilégio é barrado e redirecionado.
        const responsePayload = await axios.get(
          "/usuario/payload-usuario",
          { withCredentials: true }
        );

        if (!responsePayload.data.success) {
          alert("Você não tem permissão para acessar esta página.");
          navigate("/dashboard");
          return;
        }
        if (!responsePayload.data.payload) {
          console.error("Usuário não encontrado.");
          return;
        }

        setUser(responsePayload.data.payload);
        setCsrfToken(responsePayload.data.csrfToken);

        const response = await axios.get<{
          iptu: Iptuu[]
        }>(
          "/usuario/iptus"
        );

        setIptus(response.data.iptu);

      } catch (error) {

         if (axios.isAxiosError(error)) {

        if (error.response?.status === 403) {
            alert("Você não tem permissão para acessar esta página.");
            navigate("/dashboard");
            return;
        }

    }

      }

    };


    buscarDados();

  }, [navigate]);


  const atualizarIptu = async (
    usuarioId: number
  ) => {

    try {
      // [MUDANÇA DE SEGURANÇA - CONTROLE DE ACESSO & TOKEN ANTI-CSRF]
      // Como era antes:
      // A requisição era disparada sem token CSRF e sem validação se o usuário era administrador.
      //
      // Como foi corrigido:
      // 1. Enviamos o cabeçalho 'X-CSRF-Token' para validação do middleware verifyToken.
      // 2. Enviamos withCredentials: true para transmitir o cookie HttpOnly de autenticação
      //    validado por authJWT([1]), garantindo que apenas administradores atualizem o IPTU.
      await axios.put(
        "/usuario/atualizar-iptu",
        {
          usuarioId: usuarioId,
          novoValor: novoValor[usuarioId]
        },
        {
          headers: {
            "X-CSRF-Token": csrfToken
          },
          withCredentials: true
        }
      );


      alert("IPTU atualizado");


      // Atualiza lista novamente
      const response = await axios.get<{
        iptu: Iptuu[]
      }>(
        "/usuario/iptus"
      );

      setIptus(response.data.iptu);

    } catch (error) {

      console.error(
        "Erro ao atualizar IPTU",
        error
      );

    }

  };


  return (

    <div style={styles.container}>

      <header style={styles.header}>

        <div>

          <h2>
            Gerenciamento de IPTUs
          </h2>

          <p>
            Usuário logado: {user?.nome}
          </p>

        </div>


        <div style={{ position: "relative" }}>

          <button
            onClick={() =>
              setMenuAberto(!menuAberto)
            }
          >
            ☰ Menu
          </button>


          {menuAberto && (

            <div style={styles.dropdown}>

              <button
                onClick={() =>
                  window.location.href = "/dashboard"
                }
              >
                Voltar ao Dashboard
              </button>

            </div>

          )}

        </div>

      </header>


      <h3 style={{ marginTop: "40px" }}>
        Lista de Munícipes e IPTUs
      </h3>


      {iptus.map((iptu) => (

        <div
          key={iptu.id}
          style={styles.card}
        >

          <p>
            <strong>
              Munícipe:
            </strong>{" "}
            {iptu.nome}
          </p>


          <p>
            <strong>
              Usuário ID:
            </strong>{" "}
            {iptu.usuario_id}
          </p>


          <p>
            <strong>
              Valor Atual:
            </strong>{" "}
            {iptu.valor}
          </p>


          <input
            type="number"
            placeholder="Novo valor"
            onChange={(e) =>
              setNovoValor({
                ...novoValor,
                [iptu.usuario_id]:
                  Number(e.target.value)
              })
            }
          />


          <button
            onClick={() =>
              atualizarIptu(
                iptu.usuario_id
              )
            }
          >
            Atualizar IPTU
          </button>

        </div>

      ))}

    </div>

  );
}


const styles = {

  container: {
    padding: "40px",
    fontFamily: "Arial"
  },


  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },


  card: {
    marginTop: "20px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    width: "320px"
  },


  dropdown: {
    position: "absolute" as const,
    top: "40px",
    right: 0,
    background: "white",
    border: "1px solid #ccc",
    display: "flex",
    flexDirection: "column" as const,
    padding: "10px",
    gap: "5px"
  }

};


export default Gerenciamento;