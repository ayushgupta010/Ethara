import "./globals.css";
import Providers from "./providers";
import LayoutShell from "../components/LayoutShell";

export const metadata = {
  title: "TaskFlow | Team Task Manager",
  description: "Create projects, assign tasks, and track progress with role-based access",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
