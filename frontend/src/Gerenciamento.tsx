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


  useEffect(() => {

    const buscarDados = async () => {

      try {
        // [MUDANÇA DE SEGURANÇA - CONTROLE DE ACESSO NO FRONTEND]
        // No repo base: Lia usuário do localStorage sem validação real com o servidor.
        // Atual: Valida a sessão via /usuario/payload-usuario com cookies HttpOnly.
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
      // [MUDANÇA DE SEGURANÇA - AUTENTICAÇÃO E ROTA PROTEGIDA]
      // A rota backend PUT /usuario/atualizar-iptu é restrita ao perfil Admin (authJWT([1])).
      // Enviamos withCredentials: true para transmitir o cookie HttpOnly de autenticação.
      await axios.put(
        "/usuario/atualizar-iptu",
        {
          usuarioId: usuarioId,
          novoValor: novoValor[usuarioId]
        }, {withCredentials: true}
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