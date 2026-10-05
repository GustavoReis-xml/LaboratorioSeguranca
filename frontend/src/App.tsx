import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import Gerenciamento from "./Gerenciamento";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/gerenciamento" element={<Gerenciamento />} />
    </Routes>
  );
}

export default App;