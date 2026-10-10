import { useEffect, useState } from 'react'
import { Kli_playersService } from './generated/services/Kli_playersService'
import type { Kli_players } from './generated/models/Kli_playersModel'

function App() {
  const [players, setPlayers] = useState<Kli_players[] | null>(null)

  useEffect(() => {
    Kli_playersService.getAll({ select: ['kli_name'] }).then((result) => {
      console.log('Players from Dataverse:', result)
      setPlayers(result.data ?? [])
    })
  }, [])

  return (
    <>
      <h1>Hello, Keqing Li!</h1>
      <h2>How are you?</h2>
      <p>{players === null ? 'Loading players…' : `We have ${players.length} players.`}</p>
      <ul>
        {players?.map((player) => (
          <li key={player.kli_playerid}>{player.kli_name}</li>
        ))}
      </ul>
    </>
  )
}

export default App
