export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Crypto Price Streaming</title>
        <meta name="description" content="Real-time cryptocurrency price streaming" />
      </head>
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  )
}