export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim())
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 8
}

export const validateNickname = (nickname: string): boolean => {
  return nickname.length >= 2 && nickname.length <= 20
}
