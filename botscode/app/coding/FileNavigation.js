"use client"
import React, { useState, useEffect } from 'react'
import { ref, onValue, set, remove, update } from 'firebase/database'
import { database } from '../../firebase'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

function FileNode({ node, path, onRename, onDelete, onAdd }) {
  const [expanded, setExpanded] = useState(true)
  const isFolder = node.type === 'folder'

  const toggleExpand = () => {
    setExpanded(!expanded)
  }

  const handleRename = () => {
    const newName = prompt('Enter new name', path[path.length - 1])
    if (newName && newName !== path[path.length - 1]) {
      onRename(path, newName)
    }
  }

  const handleAddFile = () => {
    const fileName = prompt('Enter new file name')
    if (fileName) {
      onAdd(path, fileName, 'file')
    }
  }

  const handleAddFolder = () => {
    const folderName = prompt('Enter new folder name')
    if (folderName) {
      onAdd(path, folderName, 'folder')
    }
  }

  return (
    <div style={{ marginLeft: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isFolder && (
          <button onClick={toggleExpand} style={{ marginRight: 5 }}>
            {expanded ? '-' : '+'}
          </button>
        )}
        <span onDoubleClick={handleRename} style={{ cursor: 'pointer' }}>
          {path[path.length - 1]}
        </span>
        <button onClick={handleRename} style={{ marginLeft: 5 }}>Rename</button>
        <button onClick={() => onDelete(path)} style={{ marginLeft: 5 }}>Delete</button>
        {isFolder && (
          <>
            <button onClick={handleAddFile} style={{ marginLeft: 5 }}>Add File</button>
            <button onClick={handleAddFolder} style={{ marginLeft: 5 }}>Add Folder</button>
          </>
        )}
      </div>
      {isFolder && expanded && node.children && (
        <div>
          {Object.entries(node.children).map(([key, childNode]) => (
            <FileNode
              key={key}
              node={childNode}
              path={[...path, key]}
              onRename={onRename}
              onDelete={onDelete}
              onAdd={onAdd}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FileNavigation({ workspaceId }) {
  const [fileTree, setFileTree] = useState(null)

  useEffect(() => {
    const treeRef = ref(database, `workspaces/${workspaceId}/files`)
    const unsubscribe = onValue(treeRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setFileTree(data)
      } else {
        setFileTree({ type: 'folder', children: {} })
      }
    })
    return () => unsubscribe()
  }, [workspaceId])

  const updateTreeInFirebase = (newTree) => {
    set(ref(database, `workspaces/${workspaceId}/files`), newTree)
  }

  const renameNode = (path, newName) => {
    if (!fileTree) return
    const newTree = { ...fileTree }
    let parent = newTree
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent.children[path[i]]
    }
    const oldName = path[path.length - 1]
    if (parent.children[newName]) {
      alert('Name already exists')
      return
    }
    parent.children[newName] = parent.children[oldName]
    delete parent.children[oldName]
    updateTreeInFirebase(newTree)
  }

  const deleteNode = (path) => {
    if (!fileTree) return
    const newTree = { ...fileTree }
    let parent = newTree
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent.children[path[i]]
    }
    const name = path[path.length - 1]
    delete parent.children[name]
    updateTreeInFirebase(newTree)
  }

  const addNode = (path, name, type) => {
    if (!fileTree) return
    const newTree = { ...fileTree }
    let parent = newTree
    for (let i = 0; i < path.length; i++) {
      parent = parent.children[path[i]]
    }
    if (!parent.children) parent.children = {}
    if (parent.children[name]) {
      alert('Name already exists')
      return
    }
    parent.children[name] = { type, children: type === 'folder' ? {} : undefined }
    updateTreeInFirebase(newTree)
  }

  // Drag and drop handlers can be added here for future enhancement

  if (!fileTree) return <div>Loading file tree...</div>

  return (
    <div>
      <h3>File Navigation</h3>
      <FileNode
        node={fileTree}
        path={['root']}
        onRename={renameNode}
        onDelete={deleteNode}
        onAdd={addNode}
      />
    </div>
  )
}
