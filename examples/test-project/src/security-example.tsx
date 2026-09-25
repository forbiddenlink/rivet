// Example file with security vulnerabilities for testing RIVET Security Engine

import * as crypto from 'crypto'
import { exec } from 'child_process'
import * as fs from 'fs'

// HARDCODED SECRETS - CRITICAL
const apiKey = 'sk_live_1234567890abcdef'
const databasePassword = 'MySecretPassword123!'

// SQL INJECTION - HIGH
export function getUserByEmail(email: string) {
  const query = `SELECT * FROM users WHERE email = '${email}'`  // Unsafe concatenation
  return database.query(query)
}

// XSS VULNERABILITY - HIGH
export function renderUserProfile(userData: any) {
  const profileDiv = document.getElementById('profile')
  if (profileDiv) {
    profileDiv.innerHTML = userData.bio  // Unsafe DOM manipulation
  }
}

// COMMAND INJECTION - CRITICAL
export function convertImage(filename: string) {
  const command = `convert ${filename} output.jpg`  // User input in shell command
  exec(command, (error, stdout, stderr) => {
    console.log('Conversion complete')
  })
}

// PATH TRAVERSAL - HIGH
export function readUserFile(userId: string, filename: string) {
  const filePath = `/uploads/${userId}/${filename}`  // User-controlled path
  return fs.readFileSync(filePath, 'utf8')
}

// WEAK CRYPTO - HIGH
export function hashPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex')  // MD5 is broken
}

// WEAK RANDOM - MEDIUM
export function generateToken(): string {
  return Math.random().toString(36).substring(7)  // Not cryptographically secure
}

// More XSS examples
export function setPageTitle(title: string) {
  document.write(`<title>${title}</title>`)  // Unsafe document.write
}

// React component with XSS risk
export function UserComment({ comment }: { comment: string }) {
  return <div dangerouslySetInnerHTML={{ __html: comment }} />  // Unsanitized HTML
}

// Additional SQL injection
export function updateUserStatus(userId: number, status: string) {
  const sql = `UPDATE users SET status = '${status}' WHERE id = ${userId}`
  return database.execute(sql)
}

const database = {
  query: (sql: string) => Promise.resolve([]),
  execute: (sql: string) => Promise.resolve({ affectedRows: 0 }),
}
