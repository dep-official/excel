import { NextUIProvider } from "@nextui-org/react";
import ExcelSheet from "./components/ExcelSheet";

function App() {
  return (
    <NextUIProvider>
      <main className="min-h-screen bg-background text-foreground">
        <ExcelSheet />
      </main>
    </NextUIProvider>
  );
}
export default App;

