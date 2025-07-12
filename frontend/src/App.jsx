import {
  //BrowserRouter as Router, //removed this and added in main.jsx
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import Booking from "./pages/Booking";
import "./App.css";
import Home from "./pages/Home";
import NavBar from "./components/Navbar";

function App() {
  return (
    <>
      <div>
        <NavBar />
        <main className="main-content"></main>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
