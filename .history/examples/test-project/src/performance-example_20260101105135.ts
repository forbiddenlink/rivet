// Performance issues example

// Nested loops - O(n²)
function findPairs(arr: number[]) {
  const pairs: number[][] = []
  
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] + arr[j] === 10) {
        pairs.push([arr[i], arr[j]])
      }
    }
  }
  
  return pairs
}

// Array method in loop - O(n²)
function filterData(items: string[], keywords: string[]) {
  const results = []
  
  for (const item of items) {
    if (keywords.includes(item)) {
      results.push(item)
    }
  }
  
  return results
}

// DOM query in loop
function highlightElements() {
  const items = [1, 2, 3, 4, 5]
  
  for (const item of items) {
    const element = document.getElementById(`item-${item}`)
    if (element) {
      element.style.color = 'red'
    }
  }
}

// Synchronous file operations
import * as fs from 'fs'

function readConfig() {
  const data = fs.readFileSync('./config.json', 'utf-8')
  return JSON.parse(data)
}

// React component with performance issues
import React, { useState } from 'react'

function TodoList({ items }: { items: string[] }) {
  const [filter, setFilter] = useState('')
  
  // Missing dependency array
  React.useEffect(() => {
    console.log('Effect running')
  })
  
  return (
    <div>
      {items.map((item, index) => (
        // Inline function creates new reference each render
        <div key={index} onClick={() => console.log(item)}>
          {item}
        </div>
      ))}
    </div>
  )
}
