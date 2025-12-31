export const validateBVN = (bvn: string): boolean => {
  return /^\d{11}$/.test(bvn)
}

export const validateAccountNumber = (accountNo: string): boolean => {
  return /^\d{10}$/.test(accountNo)
}

export const validatePhone = (phone: string): boolean => {
  return /^0\d{10}$/.test(phone)
}

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export interface FormErrors {
  [key: string]: string
}

export const validateBVNForm = (data: any): FormErrors => {
  const errors: FormErrors = {}

  if (!data.agentLocation?.trim()) errors.agentLocation = "Agent location is required"
  if (!data.bvn?.trim()) {
    errors.bvn = "BVN is required"
  } else if (!validateBVN(data.bvn)) {
    errors.bvn = "BVN must be exactly 11 digits"
  }
  if (!data.kegowAccountNo?.trim()) {
    errors.kegowAccountNo = "Kegow account number is required"
  } else if (!validateAccountNumber(data.kegowAccountNo)) {
    errors.kegowAccountNo = "Account number must be exactly 10 digits"
  }
  if (!data.accountName?.trim()) errors.accountName = "Account name is required"
  if (!data.firstName?.trim()) errors.firstName = "First name is required"
  if (!data.lastName?.trim()) errors.lastName = "Last name is required"
  if (!data.email?.trim()) {
    errors.email = "Email is required"
  } else if (!validateEmail(data.email)) {
    errors.email = "Invalid email format"
  }
  if (!data.phone?.trim()) {
    errors.phone = "Phone number is required"
  } else if (!validatePhone(data.phone)) {
    errors.phone = "Phone must be 11 digits starting with 0"
  }
  if (!data.stateOfResidence?.trim()) errors.stateOfResidence = "State of residence is required"
  if (!data.address?.trim()) errors.address = "Address is required"
  if (!data.dob?.trim()) errors.dob = "Date of birth is required"
  if (!data.lga?.trim()) errors.lga = "LGA is required"
  if (!data.city?.trim()) errors.city = "City is required"
  if (!data.addressState?.trim()) errors.addressState = "Address state is required"

  return errors
}
