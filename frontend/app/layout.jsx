import "./globals.css";

export const metadata = {
  title: "BLS Appointment Monitor",
  description:
    "Configure your Telegram notifications for BLS Spain appointments",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
