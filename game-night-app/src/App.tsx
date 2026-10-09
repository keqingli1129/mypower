import { useState } from 'react'

function App() {
  const [playerCount] = useState<number | null>(null)

  return (
    <>
      <h1>Hello, Keqing Li!</h1>
      <h2>How are you?</h2>
      <p>{playerCount === null ? 'Loading players…' : `We have ${playerCount} players.`}</p>
    </>
  )
}

export default App
