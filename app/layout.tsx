import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Agent News ? Telegram",
  description: "Chercher des news et publier sur Telegram"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
