import { useEffect, useState } from 'react'
import { Kli_playersService } from './generated/services/Kli_playersService'

function App() {
  const [playerCount, setPlayerCount] = useState<number | null>(null)

  useEffect(() => {
    Kli_playersService.getAll({ select: ['kli_name'] }).then((result) => {
      console.log('Players from Dataverse:', result)
      setPlayerCount(result.data?.length ?? 0)
    })
  }, [])

  return (
    <>
      <h1>Hello, Keqing Li!</h1>
      <h2>How are you?</h2>
      <p>{playerCount === null ? 'Loading players…' : `We have ${playerCount} players.`}</p>
    </>
  )
}

export default App
