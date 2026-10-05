import axios from "axios";
import { useEffect, useState } from "react";

import type { Comentario } from "./Tipos/Comentario";
import type { Iptuu } from "./Tipos/Iptuu";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const navigate = useNavigate();

  const [user, setUser] = useState<{
    id: number;
    nome: string;
    email: string;
    tipo: number;
  } | null>(null);



  const [message, setMessage] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);
  const [iptu, setIptu] = useState<Iptuu | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [tipoCodigo, setTipoCodigo] = useState("codigoDeBarras");
  const [htmlRetorno, setHtmlRetorno] = useState("");
  const [csrfToken, SetCSRFToken] = useState("");


  const handleGerenciamento = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      navigate("/gerenciamento");
    } catch {
      setMessage("erro ao navegar para gerenciamento");
    }
  };


  useEffect(() => {

    const buscarDados = async () => {

      try {
        // [MUDANÇA DE SEGURANÇA - SESSÃO SEGURA VIA JWT & TOKEN ANTI-CSRF]
        // No repo base: O front lia 'user' de localStorage (inseguro).
        // Atual: Faz requisição com cookie de sessão seguro para /usuario/payload-usuario.
        // O servidor devolve os dados autenticados do usuário e o token anti-CSRF gerado.
        const responsePayload = await axios.get(
          "/usuario/payload-usuario",
          { withCredentials: true }
        );
        
        if (!responsePayload.data.success) {
          console.error("usuário nao autenticado.");
          navigate("/");
          return;
        }

        setUser(responsePayload.data.payload);
        SetCSRFToken(responsePayload.data.csrfToken);

        // [MUDANÇA DE SEGURANÇA - IDOR / BROKEN ACCESS CONTROL]
        // No repo base: Enviava { usuarioId: usuario.id } no body (qualquer um podia adulterar).
        // Atual: Apenas chama a rota; o backend identifica o usuário pelo cookie JWT validado.
        const responseIptu = await axios.get<{ iptu: Iptuu[] }>(
          "usuario/iptu-por-usuario",{withCredentials: true}
        );

        setIptu(responseIptu.data.iptu[0]);

      } catch (error) {

        console.error("Erro ao buscar dados do usuário", error);
        if (axios.isAxiosError(error) && error.response?.status === 403){
          navigate("/");
        }

      }
    };


    const buscarComentarios = async () => {

      try {

        const response = await axios.get(
          "/comentario"
        );

        setComentarios(response.data);

      } catch (error) {

        console.error(
          "Erro ao buscar comentários",
          error
        );
      }
    };


    buscarDados();
    buscarComentarios();

  }, [navigate]);


  const enviarComentario = async () => {

    if (!novoComentario.trim()) return;

    if (!user) {
      console.error ("Usuário nao encontrado no estado")
      return;
    }


    try {
      // [MUDANÇA DE SEGURANÇA - ENVIO DO TOKEN ANTI-CSRF]
      // Envia o cabeçalho X-CSRF-Token nas configurações da requisição (3º parâmetro do axios.post)
      // para validação do Double-Submit pelo middleware verifyToken no backend.
      await axios.post(
        "/comentario",
        {
          texto: novoComentario,
        },
        {
          headers: {
            "X-CSRF-Token": csrfToken
          },
          withCredentials: true
        }
      );
      
      const response = await axios.get("/comentario");
      setComentarios(response.data);
      setNovoComentario("");

    } catch (error) {

      console.error(
        "Erro ao enviar comentário",
        error
      );
    }
  };


  const buscarCodigo = async () => {

    try {
      const response = await axios.get (
        `/usuario/codigo-qr-ou-barra?tipo=${tipoCodigo}`,
        {withCredentials: true}
      );
      setHtmlRetorno(response.data);
    } catch (error){
      console.error ("erro ao buscar codigo", error);
    }
  };


  return (
    <div style={styles.container}>

      <header style={styles.header}>

        <h2>
          Bem-vindo, {user?.nome}
        </h2>


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

              {user?.id === 1 && (

                <button
                  onClick={handleGerenciamento}
                >
                  Gerenciar IPTUs {message}
                </button>

              )}

            </div>

          )}

        </div>

      </header>


      <div style={styles.card}>

        <h3>IPTU</h3>

        {iptu && (
          <p>
            Valor IPTU: {iptu.valor}
          </p>
        )}

        <p>
          Status: {iptu?.valor}
        </p>

      </div>


      <select
        value={tipoCodigo}
        onChange={(e) =>
          setTipoCodigo(e.target.value)
        }
      >

        <option value="codigoDeBarras">
          Código de Barras
        </option>

        <option value="qrcode">
          QR Code
        </option>

      </select>


      <button onClick={buscarCodigo}>
        Gerar Código
      </button>


      {/* [CENÁRIO DE LABORATÓRIO - REFLECTED XSS INTENCIONAL]
          Aqui mantemos o dangerouslySetInnerHTML propositalmente para o laboratório de XSS Refletido.
          Ele renderiza o retorno cru da rota /usuario/codigo-qr-ou-barra?tipo=..., que não é sanitizado no backend,
          permitindo demonstrar como um parâmetro malicioso na URL pode executar scripts no navegador. */}
      {htmlRetorno && (

        <div
          dangerouslySetInnerHTML={{
            __html: htmlRetorno,
          }}
        />

      )}


      <div style={{ padding: "40px" }}>

        <h2>
          Lista de Comentários
        </h2>


        <div style={{ marginBottom: "20px" }}>

          <h3>
            Adicionar Comentário
          </h3>


          <textarea
            value={novoComentario}
            onChange={(e) =>
              setNovoComentario(e.target.value)
            }
            placeholder="Digite seu comentário..."
            style={{
              width: "100%",
              height: "80px",
              padding: "10px",
              marginBottom: "10px",
            }}
          />


          <button onClick={enviarComentario}>
            Enviar Comentário
          </button>

        </div>


        <ul>

          {comentarios.map(
            (comentario, index) => (

              <li key={index}>

                <div>

                  <strong>
                    Usuário:
                  </strong>{" "}

                  {comentario.usuario_id}

                  <br />

                  <strong>
                    Mensagem:
                  </strong>


                  {/* 
                    [MUDANÇA DE SEGURANÇA - CORREÇÃO DE STORED XSS NO FRONTEND]
                    No repo base: Utilizava <div dangerouslySetInnerHTML={{ __html: comentario.texto }} />
                    Atual: Renderizado como texto puro {comentario.texto}. O React faz auto-escaping
                    garantindo que qualquer tag HTML/script seja exibida como texto e não executada.
                    (Combinado com a sanitização da biblioteca 'xss' no backend).
                  */}
                  {comentario.texto}
                  <div
                    
                  />

                </div>

              </li>

            )
          )}

        </ul>

      </div>

    </div>
  );
}


const styles = {

  container: {
    padding: "40px",
    fontFamily: "Arial",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  card: {
    marginTop: "40px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    width: "300px",
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
    gap: "5px",
  },

};


export default Dashboard;