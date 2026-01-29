// Architecture issues example

// Large class - SRP violation
class UserManager {
  createUser() {}
  updateUser() {}
  deleteUser() {}
  validateUser() {}
  sendEmail() {}
  generateReport() {}
  logActivity() {}
  cacheData() {}
  syncWithDatabase() {}
  hashPassword() {}
  encryptData() {}
  decryptData() {}
  backupData() {}
  restoreData() {}
  auditChanges() {}
  notifyAdmins() {}
  exportToCSV() {}
  importFromCSV() {}
}

// Direct instantiation - DIP violation
class EmailService {
  send(to: string, message: string) {
    console.log(`Sending ${message} to ${to}`)
  }
}

class NotificationService {
  notify(userId: string, message: string) {
    const emailService = new EmailService()
    emailService.send('user@example.com', message)
  }
}

// instanceof check - LSP violation
function processShape(shape: any) {
  if (shape instanceof Circle) {
    return Math.PI * shape.radius ** 2
  } else if (shape instanceof Square) {
    return shape.side ** 2
  }
}

class Circle {
  constructor(public radius: number) {}
}

class Square {
  constructor(public side: number) {}
}

// High coupling - too many imports and deep relative imports
import { helperA } from '../../../utils/helpers/helperA'
import { helperB } from '../../../utils/helpers/helperB'
import { helperC } from '../../../utils/helpers/helperC'
import { configA, configB, configC } from '../../../config'
import { serviceA } from '../../../services/serviceA'
import { serviceB } from '../../../services/serviceB'
import { modelA } from '../../../models/modelA'
import { modelB } from '../../../models/modelB'
import { validatorA } from '../../../validators/validatorA'
import { validatorB } from '../../../validators/validatorB'
import { transformerA } from '../../../transformers/transformerA'
import { transformerB } from '../../../transformers/transformerB'
import { mapperA } from '../../../mappers/mapperA'
import { mapperB } from '../../../mappers/mapperB'
import { formatterA } from '../../../formatters/formatterA'
import { formatterB } from '../../../formatters/formatterB'

// Law of Demeter violation - long chain
function getAddress(user: any) {
  return user.profile.contact.address.street.name
}

// Feature envy - excessive use of external object
function calculateTotal(order: any) {
  let total = 0
  total += order.getSubtotal()
  total += order.getTax()
  total += order.getShipping()
  total -= order.getDiscount()
  total += order.getFees()
  total -= order.getCredit()
  
  return total
}
