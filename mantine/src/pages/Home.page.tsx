import { ColorSchemeToggle } from "../components/ColorSchemeToggle/ColorSchemeToggle";
import { Welcome } from "../components/Welcome/Welcome";
import LynxShell from "@/pages/LynxShell";

export function HomePage() {
  return (
    <LynxShell>
      <Welcome />
      <ColorSchemeToggle />
    </LynxShell>
  );
}
