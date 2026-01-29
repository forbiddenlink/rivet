// Example file with potential issues for testing RIVET
export class UserService {
  private users: any[] = [] // Using 'any' type

  async getUser(id) {
    // Missing type annotation
    const user = this.users.find((u) => u.id == id) // Using == instead of ===
    return user.name // Potential null reference
  }

  addUser(name: string, email: string, age: number, address: string, phone: string) {
    // Long parameter list
    this.users.push({ name, email, age, address, phone })
  }
}

// Function that's too long
export function processOrder(order: any) {
  if (order.items.length > 0) {
    const total = order.items.reduce((sum: number, item: any) => sum + item.price, 0)
    if (total > 100) {
      const discount = total * 0.1
      const finalPrice = total - discount
      console.log('Discount applied:', discount)
      console.log('Final price:', finalPrice)
      return finalPrice
    }
    return total
  }
  return 0
}
