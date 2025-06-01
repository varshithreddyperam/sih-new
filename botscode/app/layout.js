import './globals.css'

export const metadata = {
  title: 'BotsCode',
  description: 'Next.js app with Tailwind CSS, Firebase, and Monaco Editor',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
