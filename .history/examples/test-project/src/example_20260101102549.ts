// Example file with intentional code smells for testing RIVET

// God Object - too many methods and responsibilities
export class OrderManager {
  private orders: any[] = []
  private customers: any[] = []
  private inventory: any[] = []
  private payments: any[] = []
  
  createOrder(data: any) { this.orders.push(data) }
  updateOrder(id: any, data: any) { /* implementation */ }
  deleteOrder(id: any) { /* implementation */ }
  getOrder(id: any) { return this.orders.find(o => o.id === id) }
  
  createCustomer(data: any) { this.customers.push(data) }
  updateCustomer(id: any, data: any) { /* implementation */ }
  deleteCustomer(id: any) { /* implementation */ }
  getCustomer(id: any) { return this.customers.find(c => c.id === id) }
  
  addInventory(item: any) { this.inventory.push(item) }
  removeInventory(id: any) { /* implementation */ }
  updateInventory(id: any, data: any) { /* implementation */ }
  
  processPayment(data: any) { this.payments.push(data) }
  refundPayment(id: any) { /* implementation */ }
}

// Long method - exceeds 50 lines
export function processComplexOrder(order: any) {
  console.log('Starting order processing...')
  
  // Magic numbers everywhere
  if (order.total > 1000) {
    console.log('Large order detected')
  }
  
  // Deep nesting - 4 levels
  if (order.items) {
    for (const item of order.items) {
      if (item.quantity > 5) {
        if (item.price > 50) {
          if (item.category === 'electronics') {
            console.log('Bulk electronics order')
            // Apply discount logic here
            const discount = item.price * 0.15
            item.discountedPrice = item.price - discount
          }
        }
      }
    }
  }
  
  // More lines to make this method long
  const subtotal = order.items.reduce((sum: number, item: any) => {
    return sum + (item.discountedPrice || item.price) * item.quantity
  }, 0)
  
  const tax = subtotal * 0.08  // Magic number
  const shipping = subtotal > 100 ? 0 : 15  // Magic numbers
  const total = subtotal + tax + shipping
  
  console.log('Subtotal:', subtotal)
  console.log('Tax:', tax)
  console.log('Shipping:', shipping)
  console.log('Total:', total)
  
  // Validate payment
  if (order.payment) {
    if (order.payment.method === 'credit') {
      if (order.payment.cardNumber) {
        if (order.payment.cvv) {
          console.log('Payment validated')
        }
      }
    }
  }
  
  // Process shipment
  if (order.shippingAddress) {
    console.log('Preparing shipment to:', order.shippingAddress)
  }
  
  // Send notifications
  console.log('Sending confirmation email...')
  console.log('Sending SMS notification...')
  
  // Update inventory
  for (const item of order.items) {
    console.log('Updating inventory for:', item.name)
  }
  
  // Log analytics
  console.log('Recording analytics...')
  
  return {
    orderId: Math.random() * 999999,  // Magic number
    total,
    status: 'processed'
  }
}
