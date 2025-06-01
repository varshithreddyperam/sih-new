"use client"
import { useState, useEffect } from "react"
import { ref, onValue, set, onDisconnect, push, remove } from "firebase/database"
import { auth, database } from "../../firebase"

export default function Collaboration({ userId }) {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [workspaceMembers, setWorkspaceMembers] = useState([])
  const [joinExitEvents, setJoinExitEvents] = useState([])

  useEffect(() => {
    if (!userId) return

    // Track user presence
    const userStatusRef = ref(database, `onlineUsers/${userId}`)
    set(userStatusRef, true)
    onDisconnect(userStatusRef).remove()

    // Listen for online users
    const onlineUsersRef = ref(database, "onlineUsers")
    const unsubscribeOnline = onValue(onlineUsersRef, (snapshot) => {
      const users = snapshot.val() || {}
      setOnlineUsers(Object.keys(users))
    })

    // Listen for workspace members
    const workspaceMembersRef = ref(database, "workspaceMembers")
    const unsubscribeMembers = onValue(workspaceMembersRef, (snapshot) => {
      const members = snapshot.val() || {}
      setWorkspaceMembers(Object.keys(members))
    })

    // Listen for join/exit events
    const eventsRef = ref(database, "joinExitEvents")
    const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
      const events = snapshot.val() || {}
      // Convert events object to array sorted by timestamp descending
      const eventsArray = Object.values(events).sort((a, b) => b.timestamp - a.timestamp)
      setJoinExitEvents(eventsArray)
    })

    // Add join event
    const joinEventRef = push(ref(database, "joinExitEvents"))
    set(joinEventRef, {
      userId,
      type: "join",
      timestamp: Date.now(),
    })
    onDisconnect(joinEventRef).remove()

    // Add user to workspaceMembers
    const memberRef = ref(database, `workspaceMembers/${userId}`)
    set(memberRef, true)
    onDisconnect(memberRef).remove()

    return () => {
      unsubscribeOnline()
      unsubscribeMembers()
      unsubscribeEvents()
      // Add exit event on unmount
      const exitEventRef = push(ref(database, "joinExitEvents"))
      set(exitEventRef, {
        userId,
        type: "exit",
        timestamp: Date.now(),
      })
      onDisconnect(exitEventRef).remove()
      // Remove user from onlineUsers and workspaceMembers
      remove(userStatusRef)
      remove(memberRef)
    }
  }, [userId])

  return (
    <div className="collaboration-container p-4 bg-gray-800 rounded text-white w-full max-w-6xl mt-6">
      <h2 className="text-lg font-semibold mb-2">Online Users ({onlineUsers.length})</h2>
      <ul className="mb-4 list-disc list-inside">
        {onlineUsers.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>
      <h2 className="text-lg font-semibold mb-2">Workspace Members ({workspaceMembers.length})</h2>
      <ul className="mb-4 list-disc list-inside">
        {workspaceMembers.map((member) => (
          <li key={member}>{member}</li>
        ))}
      </ul>
      <h2 className="text-lg font-semibold mb-2">Join/Exit Events</h2>
      <ul className="list-disc list-inside max-h-40 overflow-y-auto">
        {joinExitEvents.map((event, index) => (
          <li key={index}>
            User {event.userId} {event.type}ed at {new Date(event.timestamp).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  )
}
