import React, { useEffect, useState, useCallback } from "react"
import { GnoJSONRPCProvider } from "@gnolang/gno-js-client"
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  ForwardIcon,
} from "@heroicons/react/24/solid"

// TODO: These presets are useless. Make some good ones.
const PRESETS = {
  glider: "     \\n  O  \\n   O \\n OOO \\n     ",
  blinker: "     \\n     \\n OOO \\n     \\n     ",
  block: "    \\n OO \\n OO \\n    ",
}

export default function App() {
  const chainId = import.meta.env.VITE_CHAIN_ID || "dev"
  const remoteRPC = import.meta.env.VITE_REMOTE_RPC || "http://127.0.0.1:26657"
  const realmPath = import.meta.env.VITE_REALM_PATH || "gno.land/r/wyhaines/gameoflife"

  const [provider] = useState(() => new GnoJSONRPCProvider(remoteRPC))
  const [dimensions, setDimensions] = useState({ width: 20, height: 20 })
  const [density, setDensity] = useState(0.3)
  const [isRunning, setIsRunning] = useState(false)
  const [generation, setGeneration] = useState("")
  const [showSettings, setShowSettings] = useState(true)
  const [error, setError] = useState(null)
  const [cellColor, setCellColor] = useState('#10b981') // default emerald-500
  const [cellCharacters, setCellCharacters] = useState(' O') // default space and X

  const generateRandomBoard = useCallback(() => {
    const rows = []
    const chars = cellCharacters.split('').filter(c => c !== ' ')
    
    for (let i = 0; i < dimensions.height; i++) {
      let row = ""
      for (let j = 0; j < dimensions.width; j++) {
        if (Math.random() < density) {
          // Randomly select one of the provided characters
          // Skew the odds of selecting a given character by inputting it into the UI more than once
          const randomChar = chars[Math.floor(Math.random() * chars.length)]
          row += randomChar
        } else {
          row += " "
        }
      }
      rows.push(row)
    }
    return rows.join("\\n")
  }, [dimensions, density, cellCharacters])

  const renderNewGeneration = async (board) => {
    try {
      const output = await provider.getRenderOutput(realmPath, board)
      return output
    } catch (err) {
      console.error("Error calling Render:", err)
      setError(`Error rendering generation: ${err.message}`)
      setIsRunning(false)
      return null
    }
  }

  useEffect(() => {
    let intervalId

    if (isRunning && generation) {
      intervalId = setInterval(async () => {
        const nextGen = await renderNewGeneration(generation)
        if (nextGen === generation) {
          setIsRunning(false)
        } else {
          setGeneration(nextGen)
        }
      }, 200)
    }

    return () => clearInterval(intervalId)
  }, [isRunning, generation])

  useEffect(() => {
    setGeneration(generateRandomBoard())
  }, [])

  useEffect(() => {
    if (showSettings) {
      setGeneration(generateRandomBoard())
    }
  }, [dimensions.width, dimensions.height, density])

  const handleStart = () => {
    if (!generation) {
      setGeneration(generateRandomBoard())
    }
    setIsRunning(true)
  }

  const handleReset = () => {
    setIsRunning(false)
    setGeneration("")
    setShowSettings(true)
  }

  const handleRegenerate = () => {
    setGeneration(generateRandomBoard())
  }

  const handleStep = async () => {
    if (generation) {
      const nextGen = await renderNewGeneration(generation)
      if (nextGen) {
        setGeneration(nextGen)
      }
    }
  }

  const renderBoard = (board) => {
    if (!board) return null;
    const rows = board.split("\\n");
    
    return (
      <div className="overflow-auto max-w-full">
        <div 
          className="board"
          style={{
            gridTemplateColumns: `repeat(${rows[0].length}, 1rem)`,
            gridTemplateRows: `repeat(${rows.length}, 1rem)`,
            ...cellStyles
          }}
        >
          {rows.flatMap((row, i) => 
            Array.from(row).map((cell, j) => (
              <div 
                key={`${i}-${j}`}
                className={`cell ${cell !== " " ? "cell-alive" : "cell-dead"}`}
              >
                {cell !== " " ? cell : " "}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const settingsJSX = (
    <div className="space-y-6 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Board Size
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400">Width</label>
            <input
              type="number"
              value={dimensions.width}
              onChange={(e) => setDimensions(d => ({ ...d, width: parseInt(e.target.value) }))}
              className="input-number mt-1 block w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Height</label>
            <input
              type="number"
              value={dimensions.height}
              onChange={(e) => setDimensions(d => ({ ...d, height: parseInt(e.target.value) }))}
              className="input-number mt-1 block w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Initial Density ({Math.round(density * 100)}%)
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={density}
          onChange={(e) => setDensity(parseFloat(e.target.value))}
          className="input-range"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cell Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={cellColor}
              onChange={(e) => setCellColor(e.target.value)}
              className="h-10 w-20 rounded cursor-pointer bg-gray-700 border border-gray-600"
            />
            <span className="text-gray-400 text-sm">{cellColor}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cell Characters
          </label>
          <input
            type="text"
            value={cellCharacters}
            onChange={(e) => setCellCharacters(e.target.value)}
            placeholder="Enter characters (space separated)"
            className="input-number w-full"
          />
          <p className="mt-1 text-sm text-gray-400">
            Space character is always dead cell
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Presets
          </label>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(PRESETS).map(([name, pattern]) => (
              <button
                key={name}
                onClick={() => setGeneration(pattern)}
                className="preset-btn"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={handleRegenerate}
          className="btn-secondary"
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Regenerate Random
        </button>
      </div>
    </div>
  )

  const cellStyles = {
    '--cell-color': cellColor,
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 text-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
          Conway's Game of Life
        </h1>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="control-panel">
          {showSettings && settingsJSX}

          <div className="flex flex-col items-center space-y-6">
            <div className="w-full flex justify-center p-4 bg-gray-800/50 rounded-lg">
              {renderBoard(generation)}
            </div>

            <div className="flex space-x-4">
              {!showSettings && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="btn-secondary"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                  Settings
                </button>
              )}

              <button
                onClick={() => isRunning ? setIsRunning(false) : handleStart()}
                className="btn-primary"
              >
                {isRunning ? (
                  <>
                    <PauseIcon className="h-5 w-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Start
                  </>
                )}
              </button>

              <button
                onClick={handleStep}
                disabled={isRunning}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ForwardIcon className="h-5 w-5 mr-2" />
                Step
              </button>

              <button
                onClick={handleReset}
                className="btn-secondary"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
