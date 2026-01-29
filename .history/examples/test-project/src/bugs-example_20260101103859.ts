// Example file with common bugs for testing RIVET Bug Engine

// NULL CHECK ISSUES
export function processUser(user: any) {
  // Missing null check - will crash if user is null/undefined
  const name = user.name.toUpperCase()
  
  // Unsafe array access
  const items = user.items
  const firstItem = items[0]  // No check if items exists or has elements
  
  return {
    name,
    itemCount: items.length,  // Potential null access
    firstItem
  }
}

// UNHANDLED PROMISES
export async function fetchData(url: string) {
  // Promise without error handling
  fetch(url).then(response => response.json())  // No .catch()
  
  // Async function without try-catch
  const data = await fetch(url)
  const json = await data.json()  // Could fail
  
  return json
}

export function saveData(data: any) {
  // Promise not awaited or caught
  database.save(data)  // Fire and forget - errors ignored
}

// LOGIC ERRORS
export function checkValue(x: number, y: number) {
  // Assignment in conditional (should be ==)
  if (x = 5) {  // Bug: assignment instead of comparison
    return true
  }
  
  // Comparing variable to itself
  if (x === x) {  // Always true
    console.log('This is meaningless')
  }
  
  // Duplicate condition
  if (y > 10) {
    return 'high'
  } else if (y > 10) {  // Duplicate - will never execute
    return 'very high'
  }
  
  return 'low'
}

// TYPE COERCION ISSUES
export function compareValues(a: any, b: any) {
  // Loose equality
  if (a == b) {  // Should use ===
    return true
  }
  
  // Comparing to NaN
  if (a === NaN) {  // Always false - should use isNaN()
    return 'Not a number'
  }
  
  // String + number coercion
  const result = '5' + 3  // Returns '53' not 8
  
  return result
}

export function checkEmpty(arr: any[]) {
  // Array in boolean context
  if ([]) {  // Always truthy, even for empty array
    console.log('This always runs')
  }
  
  // Should check length
  if (arr.length > 0) {
    console.log('Correct way')
  }
}

// UNREACHABLE CODE
export function earlyReturn(value: number) {
  if (value > 0) {
    return 'positive'
    console.log('This never runs')  // Unreachable
  }
  
  return 'non-positive'
  
  // More unreachable code
  const extra = value * 2
  return extra
}

export function emptyErrorHandling() {
  try {
    dangerousOperation()
  } catch (error) {
    // Empty catch - errors silently swallowed
  }
}

// Helper
const database = {
  save: (data: any) => Promise.resolve(),
}

function dangerousOperation() {
  throw new Error('Something went wrong')
}
