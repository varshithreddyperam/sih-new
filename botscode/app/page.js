"use client"
import Editor from "@monaco-editor/react";
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, provider } from '../firebase'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updatePassword,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        router.push('/coding')
      } else {
        setUser(null)
      }
    })
    return () => unsubscribe()
  }, [router])

  const signInWithGoogle = () => {
    console.log('signInWithGoogle called')
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log('signInWithPopup success:', result)
        setUser(result.user)
        setMessage('Signed in with Google')
        router.push('/coding')
      })
      .catch((error) => {
        console.error('signInWithPopup error:', error)
        setMessage('Google sign-in error: ' + error.message)
      })
  }

  const handleEmailSignIn = () => {
    if (isNewUser) {
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          setUser(userCredential.user)
          setMessage('User registered and signed in')
          router.push('/coding')
        })
        .catch((error) => {
          setMessage('Registration error: ' + error.message)
        })
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          setUser(userCredential.user)
          setMessage('Signed in with email')
          router.push('/coding')
        })
        .catch((error) => {
          setMessage('Sign-in error: ' + error.message)
        })
    }
  }

  const sendOtp = () => {
    if (!phone) {
      setMessage('Please enter phone number')
      return
    }
    window.recaptchaVerifier = new RecaptchaVerifier(
      'recaptcha-container',
      {
        size: 'invisible',
        callback: () => {}
      },
      auth
    )
    const appVerifier = window.recaptchaVerifier
    signInWithPhoneNumber(auth, phone, appVerifier)
      .then((confirmationResult) => {
        setConfirmationResult(confirmationResult)
        setMessage('OTP sent to ' + phone)
      })
      .catch((error) => {
        setMessage('OTP send error: ' + error.message)
      })
  }

  const verifyOtp = () => {
    if (!otp || !confirmationResult) {
      setMessage('Please enter OTP')
      return
    }
    confirmationResult
      .confirm(otp)
      .then((result) => {
        setUser(result.user)
        setMessage('Phone number verified and signed in')
        router.push('/coding')
      })
      .catch((error) => {
        setMessage('OTP verification error: ' + error.message)
      })
  }

  const resetPassword = () => {
    if (!email) {
      setMessage('Please enter email for password reset')
      return
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setMessage('Password reset email sent')
      })
      .catch((error) => {
        setMessage('Password reset error: ' + error.message)
      })
  }

  const changePassword = () => {
    if (!user) {
      setMessage('You must be signed in to change password')
      return
    }
    if (!password) {
      setMessage('Please enter new password')
      return
    }
    updatePassword(user, password)
      .then(() => {
        setMessage('Password updated successfully')
      })
      .catch((error) => {
        setMessage('Password update error: ' + error.message)
      })
  }

  const signOutUser = () => {
    signOut(auth)
      .then(() => {
        setUser(null)
        setMessage('Signed out')
        router.push('/')
      })
      .catch((error) => {
        setMessage('Sign out error: ' + error.message)
      })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6 flex flex-col items-center font-sans">
      <div className="w-full max-w-md bg-opacity-10 bg-gray-800 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-10 border border-gray-700">
        {!user ? (
          <>
            <h2 className="text-4xl font-extrabold mb-8 text-center text-white tracking-wide drop-shadow-lg">
              🚀 Welcome to <span className="text-blue-500">BotsCode</span>
            </h2>

            <button
              onClick={signInWithGoogle}
              className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 transition-all duration-300 text-white font-semibold rounded-lg shadow-lg"
            >
              Sign in with Google
            </button>

            <div className="flex items-center justify-between mb-6">
              <label htmlFor="registerToggle" className="flex items-center text-gray-300 text-sm cursor-pointer">
                <input
                  id="registerToggle"
                  type="checkbox"
                  checked={isNewUser}
                  onChange={() => setIsNewUser(!isNewUser)}
                  className="mr-2 accent-blue-500"
                />
                Register new user
              </label>
              <button
                onClick={resetPassword}
                className="text-sm text-red-400 hover:text-red-300 transition"
              >
                Forgot Password?
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                onClick={handleEmailSignIn}
                className="w-full bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 transition-all duration-300 text-white py-3 rounded-lg shadow-md font-semibold"
              >
                {isNewUser ? 'Register' : 'Sign In'}
              </button>
            </div>

            <div className="mb-6 space-y-4">
              <input
                type="tel"
                placeholder="Phone number (+1234567890)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
              />
              <button
                onClick={sendOtp}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 transition-all duration-300 text-white py-3 rounded-lg shadow-md font-semibold"
              >
                Send OTP
              </button>
            </div>

            {confirmationResult && (
              <div className="mb-6 space-y-4">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
                <button
                  onClick={verifyOtp}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 transition-all duration-300 text-white py-3 rounded-lg shadow-md font-semibold"
                >
                  Verify OTP
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="mb-6 text-center text-gray-300 text-lg">
              Signed in as <span className="text-blue-400">{user.email || user.phoneNumber}</span>
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => router.push('/coding')}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white rounded-lg shadow-md font-semibold"
              >
                Go to Coding Page
              </button>
              <button
                onClick={changePassword}
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-800 hover:from-orange-500 hover:to-orange-700 text-white rounded-lg shadow-md font-semibold"
              >
                Change Password
              </button>
              <button
                onClick={signOutUser}
                className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 text-white rounded-lg shadow-md font-semibold"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>

      <div id="recaptcha-container"></div>
    </div>
  )
}
