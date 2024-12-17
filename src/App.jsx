import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [grid, setGrid] = useState(Array(4).fill().map(() => Array(4).fill(0)))
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('highScore') || '0'))
  const [gameOver, setGameOver] = useState(false)
  const [mergedCells, setMergedCells] = useState([])
  const [movingCells, setMovingCells] = useState([])

  // Initialize the game
  useEffect(() => {
    initializeGame()
  }, [])

  const initializeGame = () => {
    const newGrid = Array(4).fill().map(() => Array(4).fill(0))
    addNewTile(newGrid)
    addNewTile(newGrid)
    setGrid(newGrid)
    setScore(0)
    setGameOver(false)
    setMergedCells([])
    setMovingCells([])
  }

  const addNewTile = (currentGrid) => {
    const emptyCells = []
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (currentGrid[i][j] === 0) {
          emptyCells.push({ x: i, y: j })
        }
      }
    }
    if (emptyCells.length > 0) {
      const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      currentGrid[x][y] = Math.random() < 0.9 ? 2 : 4
    }
  }

  const moveGrid = (direction) => {
    if (gameOver) return

    let newGrid = JSON.parse(JSON.stringify(grid))
    let moved = false
    let newScore = score
    let newMergedCells = []
    let newMovingCells = []

    // Rotate grid to handle all directions uniformly
    if (direction === 'right') rotateGrid(newGrid, 2)
    else if (direction === 'up') rotateGrid(newGrid, 3)
    else if (direction === 'down') rotateGrid(newGrid, 1)

    // Move and merge tiles
    for (let i = 0; i < 4; i++) {
      const row = newGrid[i].filter(cell => cell !== 0)
      let newRow = []
      let skipNext = false

      for (let j = 0; j < row.length; j++) {
        if (skipNext) {
          skipNext = false
          continue
        }

        if (j < row.length - 1 && row[j] === row[j + 1]) {
          const mergedValue = row[j] * 2
          newRow.push(mergedValue)
          newScore += mergedValue
          skipNext = true
          newMergedCells.push({ row: i, col: newRow.length - 1 })
        } else {
          newRow.push(row[j])
        }
      }

      // Track moving cells
      const oldRowLength = newGrid[i].filter(x => x !== 0).length
      if (oldRowLength !== newRow.length) {
        newMovingCells.push({ row: i, from: oldRowLength, to: newRow.length })
      }

      const filledRow = newRow.concat(Array(4 - newRow.length).fill(0))
      if (JSON.stringify(newGrid[i]) !== JSON.stringify(filledRow)) moved = true
      newGrid[i] = filledRow
    }

    // Rotate back
    if (direction === 'right') rotateGrid(newGrid, 2)
    else if (direction === 'up') rotateGrid(newGrid, 1)
    else if (direction === 'down') rotateGrid(newGrid, 3)

    if (moved) {
      addNewTile(newGrid)
      setGrid(newGrid)
      setScore(newScore)
      setMergedCells(newMergedCells)
      setMovingCells(newMovingCells)
      
      // Update high score
      if (newScore > highScore) {
        setHighScore(newScore)
        localStorage.setItem('highScore', newScore.toString())
      }
      
      setTimeout(() => {
        setMergedCells([])
        setMovingCells([])
      }, 300)

      checkGameOver(newGrid)
    }
  }

  const rotateGrid = (grid, times = 1) => {
    for (let t = 0; t < times; t++) {
      for (let i = 0; i < 2; i++) {
        for (let j = i; j < 3 - i; j++) {
          const temp = grid[i][j]
          grid[i][j] = grid[3 - j][i]
          grid[3 - j][i] = grid[3 - i][3 - j]
          grid[3 - i][3 - j] = grid[j][3 - i]
          grid[j][3 - i] = temp
        }
      }
    }
  }

  const checkGameOver = (currentGrid) => {
    // Check if any moves are possible
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (currentGrid[i][j] === 0) return
        if (i < 3 && currentGrid[i][j] === currentGrid[i + 1][j]) return
        if (j < 3 && currentGrid[i][j] === currentGrid[i][j + 1]) return
      }
    }
    setGameOver(true)
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      switch(e.key) {
        case 'ArrowLeft': moveGrid('left'); break
        case 'ArrowRight': moveGrid('right'); break
        case 'ArrowUp': moveGrid('up'); break
        case 'ArrowDown': moveGrid('down'); break
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [grid, gameOver])

  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 })

  const handleTouchStart = (e) => {
    setTouchStart({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    })
  }

  const handleTouchMove = (e) => {
    setTouchEnd({ 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY 
    })
  }

  const handleTouchEnd = () => {
    const deltaX = touchEnd.x - touchStart.x
    const deltaY = touchEnd.y - touchStart.y
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    if (absDeltaX > 50 || absDeltaY > 50) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        moveGrid(deltaX > 0 ? 'right' : 'left')
      } else {
        // Vertical swipe
        moveGrid(deltaY > 0 ? 'down' : 'up')
      }
    }
  }

  useEffect(() => {
    const gridElement = document.querySelector('.grid')
    if (gridElement) {
      gridElement.addEventListener('touchstart', handleTouchStart, { passive: false })
      gridElement.addEventListener('touchmove', handleTouchMove, { passive: false })
      gridElement.addEventListener('touchend', handleTouchEnd, { passive: false })
      
      return () => {
        gridElement.removeEventListener('touchstart', handleTouchStart)
        gridElement.removeEventListener('touchmove', handleTouchMove)
        gridElement.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [])

  useEffect(() => {
    const metaViewport = document.createElement('meta')
    metaViewport.name = 'viewport'
    metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    document.head.appendChild(metaViewport)

    return () => {
      document.head.removeChild(metaViewport)
    }
  }, [])

  const getCellColor = (value) => {
    const colors = {
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e',
      4096: '#5d3f97', // Deep purple
      8192: '#8e44ad', // Rich purple
      16384: '#2980b9', // Bright blue
      32768: '#27ae60', // Emerald green
      65536: '#d35400', // Dark orange
      131072: '#c0392b', // Deep red
      262144: '#16a085', // Teal
      524288: '#2c3e50', // Dark blue-grey
      1048576: '#f39c12'  // Bright orange
    }
    return colors[value] || (value > 1048576 ? '#000000' : '#cdc1b4') // Black for extremely large numbers
  }

  const moveUp = () => {
    moveGrid('up')
  }

  const moveDown = () => {
    moveGrid('down')
  }

  const moveLeft = () => {
    moveGrid('left')
  }

  const moveRight = () => {
    moveGrid('right')
  }

  const MobileNavArrows = () => {
    return (
      <div className="mobile-nav-arrows">
        <div className="arrow-row">
          <button onClick={moveUp} className="arrow-btn up-arrow">▲</button>
        </div>
        <div className="arrow-row">
          <button onClick={moveLeft} className="arrow-btn left-arrow">◀</button>
          <button onClick={moveRight} className="arrow-btn right-arrow">▶</button>
        </div>
        <div className="arrow-row">
          <button onClick={moveDown} className="arrow-btn down-arrow">▼</button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!gameOver) {
        switch (event.key) {
          case 'ArrowUp':
            moveUp();
            break;
          case 'ArrowDown':
            moveDown();
            break;
          case 'ArrowLeft':
            moveLeft();
            break;
          case 'ArrowRight':
            moveRight();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameOver, moveUp, moveDown, moveLeft, moveRight]);

  return (
    <div className="app">
      <div className="game-container">
        <div className="title-section">
          <h1>2048</h1>
          <p className="creator">by Promise Omisakin</p>
        </div>

        <div className="score-container">
          <div className="score-box">
            <div className="score-label">SCORE</div>
            <div className="score-value">{score}</div>
          </div>
          <div className="score-box">
            <div className="score-label">BEST</div>
            <div className="score-value">{highScore}</div>
          </div>
          <button onClick={initializeGame}>New Game</button>
        </div>

        <div className="grid">
          {grid.map((row, i) => (
            row.map((cell, j) => (
              <div 
                key={`${i}-${j}`} 
                className={`cell ${
                  mergedCells.some(mc => mc.row === i && mc.col === j) ? 'merged' : ''
                } ${
                  movingCells.some(mc => mc.row === i) ? 'moving' : ''
                }`}
                style={{
                  backgroundColor: getCellColor(cell),
                  color: cell <= 4 ? '#776e65' : '#f9f6f2'
                }}
              >
                {cell || ''}
              </div>
            ))
          ))}
        </div>

        {gameOver && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <p>Final Score: {score}</p>
            <button onClick={initializeGame}>Try Again</button>
          </div>
        )}

        {/* Add mobile navigation arrows */}
        <MobileNavArrows />
      </div>

      <div className="instructions">
        <p>How to play on PC: Use your arrow keys to move the tiles. When two tiles with the same number touch, they merge into one!</p>
      </div>
        
      <div className="instructions">
        <p>Challenge: Can you reach beyond 2048? Merge tiles to create even larger numbers!</p>
      </div>
    </div>
  )
}

export default App
