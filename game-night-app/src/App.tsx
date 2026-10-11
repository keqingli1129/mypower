import { useEffect, useState } from 'react'
import { Kli_playersService } from './generated/services/Kli_playersService'
import type { Kli_players } from './generated/models/Kli_playersModel'

function App() {
  const [players, setPlayers] = useState<Kli_players[] | null>(null)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    Kli_playersService.getAll({ select: ['kli_name'] }).then((result) => {
      console.log('Players from Dataverse:', result)
      setPlayers(result.data ?? [])
    })
  }, [])

  async function handleAdd() {
    const result = await Kli_playersService.create({ kli_name: newName, statecode: 0 })
    console.log('Created:', result)
    const newPlayer = result.data
    if (newPlayer) {
      setPlayers((current) => [...(current ?? []), newPlayer])
      setNewName('')
    }
  }

  function handleDelete(id: string) {
    console.log('Delete clicked, id =', id)
  }

  return (
    <>
      <h1>Hello, Keqing Li!</h1>
      <h2>How are you?</h2>
      <p>{players === null ? 'Loading players…' : `We have ${players.length} players.`}</p>
      <ul>
        {players?.map((player) => (
          <li key={player.kli_playerid}>
            {player.kli_name}{' '}
            <button onClick={() => handleDelete(player.kli_playerid)}>✕</button>
          </li>
        ))}
      </ul>
      <input
        placeholder="New player name"
        value={newName}
        onChange={(event) => setNewName(event.target.value)}
      />
      <button onClick={handleAdd} disabled={newName.trim() === ''}>Add</button>
    </>
  )
}

export default App
