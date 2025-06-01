"use client"
import { useState, useEffect, useRef } from 'react'
import { auth, database } from '../../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { ref, set, onValue } from 'firebase/database'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { debounce } from 'lodash'
import { getSuggestions, getAutoDocumentation, getSyntaxFix } from './geminiApi'
import Collaboration from './Collaboration'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const supportedLanguages = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Go', value: 'go' },
]

export default function CodingPage() {
  const [user, setUser] = useState(null)
  const [code, setCode] = useState('// Start coding...')
  const codeRef = useRef(code)
  const [language, setLanguage] = useState('javascript')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [isLocalChange, setIsLocalChange] = useState(false)
  const [lastLocalChangeTime, setLastLocalChangeTime] = useState(0)
  const router = useRouter()

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/')
      } else {
        setUser(currentUser)
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!user) return
    const codeDbRef = ref(database, 'users/' + user.uid + '/code')
    const languageRef = ref(database, 'users/' + user.uid + '/language')
    const unsubscribe = onValue(codeDbRef, (snapshot) => {
      const dbCode = snapshot.val()
      console.log('onValue listener received code:', dbCode)
      const now = Date.now()
      if (
        dbCode !== null &&
        dbCode !== codeRef.current &&
        (now - lastLocalChangeTime > 1500)
      ) {
        setCode(dbCode)
        codeRef.current = dbCode
      }
    })
    const unsubscribeLang = onValue(languageRef, (snapshot) => {
      const dbLang = snapshot.val()
      console.log('onValue listener received language:', dbLang)
      if (dbLang !== null && dbLang !== language) {
        setLanguage(dbLang)
      }
    })
    return () => {
      unsubscribe()
      unsubscribeLang()
    }
  }, [user, lastLocalChangeTime])

  const handleCodeChange = (value) => {
    console.log('handleCodeChange called with value:', value)
    setIsLocalChange(true)
    setLastLocalChangeTime(Date.now())
    setCode(value || '')
    codeRef.current = value || ''
    debouncedSave(value || '', language)
  }

  const saveCodeToFirebase = (value, lang) => {
    console.log('saveCodeToFirebase called with value:', value, 'language:', lang)
    if (user) {
      set(ref(database, 'users/' + user.uid + '/code'), value)
        .then(() => {
          console.log('Debounced save successful')
        })
        .catch((error) => {
          console.error('Debounced save error:', error)
          setMessage('Error saving code: ' + error.message)
        })
      set(ref(database, 'users/' + user.uid + '/language'), lang)
        .then(() => {
          console.log('Language save successful')
        })
        .catch((error) => {
          console.error('Language save error:', error)
          setMessage('Error saving language: ' + error.message)
        })
    } else {
      console.warn('No user to save code for')
    }
  }

  const debouncedSave = debounce(saveCodeToFirebase, 2000)

  const saveCode = () => {
    if (!user) {
      setMessage('Please sign in first')
      router.push('/')
      return
    }
    console.log('saveCode called with code:', code, 'language:', language)
    setLoading(true)
    set(ref(database, 'users/' + user.uid + '/code'), code)
      .then(() => {
        console.log('Manual save successful')
        setMessage('Code saved successfully')
      })
      .catch((error) => {
        console.error('Manual save error:', error)
        setMessage('Error saving code: ' + error.message)
      })
    set(ref(database, 'users/' + user.uid + '/language'), language)
      .then(() => {
        console.log('Language manual save successful')
      })
      .catch((error) => {
        console.error('Language manual save error:', error)
        setMessage('Error saving language: ' + error.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const runCode = async () => {
    setOutput('')
    setRunning(true)
    try {
      // Call backend API for all languages including JavaScript
      const response = await fetch('/api/runCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      })
      const data = await response.json()
      setOutput(data.output || 'No output')
    } catch (error) {
      setOutput('Error: ' + error.message)
    } finally {
      setRunning(false)
    }
  }

  const handleAiRequest = async (type) => {
    if (!apiKey) {
      setAiError('API key is not set. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.')
      return
    }
    setAiLoading(true)
    setAiError(null)
    setAiResponse(null)
    try {
      let response
      if (type === 'suggestions') {
        response = await getSuggestions(code, apiKey)
      } else if (type === 'documentation') {
        response = await getAutoDocumentation(code, apiKey)
      } else if (type === 'syntaxFix') {
        response = await getSyntaxFix(code, apiKey)
      }
      setAiResponse(JSON.stringify(response, null, 2))
    } catch (error) {
      setAiError(error.message)
    } finally {
      setAiLoading(false)
    }
  }

  if (!user) {
    return <p>Loading...</p>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-6xl rounded-xl overflow-hidden shadow-2xl">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mb-4 p-2 rounded bg-gray-700 text-white"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <MonacoEditor
          height="60vh"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 16,
            folding: true,
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
          }}
          className="rounded-lg"
        />
      </div>
      <div className="mt-4 flex space-x-4">
        <button
          onClick={() => handleAiRequest('suggestions')}
          disabled={aiLoading}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
        >
          AI Suggestions
        </button>
        <button
          onClick={() => handleAiRequest('documentation')}
          disabled={aiLoading}
          className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
        >
          Auto-Documentation
        </button>
        <button
          onClick={() => handleAiRequest('syntaxFix')}
          disabled={aiLoading}
          className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
        >
          Syntax Fix
        </button>
        <button
          onClick={runCode}
          disabled={running}
          className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600"
        >
          {running ? 'Running...' : 'Run Code'}
        </button>
      </div>
      {aiLoading && <p className="mt-4 text-center text-sm text-yellow-300">Loading AI response...</p>}
      {aiError && <p className="mt-4 text-center text-sm text-red-500">Error: {aiError}</p>}
      {aiResponse && (
        <pre className="mt-4 w-full max-w-6xl p-4 bg-gray-900 rounded text-sm overflow-x-auto whitespace-pre-wrap">
          {aiResponse}
        </pre>
      )}
      {output && (
        <pre className="mt-4 w-full max-w-6xl p-4 bg-gray-900 rounded text-sm overflow-x-auto whitespace-pre-wrap text-green-400">
          {output}
        </pre>
      )}
      <button
        onClick={saveCode}
        disabled={loading}
        className={`mt-6 px-6 py-3 rounded-lg shadow-md font-semibold text-white ${
          loading
            ? 'bg-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700'
        }`}
      >
        {loading ? 'Saving...' : 'Save Code'}
      </button>
      {message && (
        <p className="mt-4 text-center text-sm text-yellow-300">{message}</p>
      )}
      <Collaboration userId={user.uid} />
    </div>
  )
}
