import { Moon, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const themes: { name: "light" | "dark" | "system"; icon: any }[] = [
    { name: "light", icon: Sun },
    { name: "dark", icon: Moon },
    { name: "system", icon: SunMoon },
  ];

  const handleClick = () => {
    const currentIndex = themes.findIndex((t) => t.name === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].name);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative w-10 h-10 rounded-full"
    >
      {themes.map(({ name, icon: Icon }) => (
        <Icon
          key={name}
          className={`
            absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
            transition-all duration-300 ease-in-out
            ${theme === name ? "opacity-100 scale-100" : "opacity-0 scale-75"}
          `}
        />
      ))}
    </Button>
  );
}
