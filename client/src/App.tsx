import HomePage from "./components/HomePage";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <>
      <Toaster />
      <nav className="flex">
        <a href={"/"} className="flex-center gap-2">
          <img
            src={"/assets/images/logo.png"}
            alt="logo"
            height={40}
            width={40}
          />
          <p className="text-xl font-semibold">Giffy</p>
        </a>
      </nav>
      <HomePage />
    </>
  );
}

export default App;
