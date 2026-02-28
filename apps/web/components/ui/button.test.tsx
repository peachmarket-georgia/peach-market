import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button component', () => {
  it('should render children correctly', () => {
    render(<Button>Click me</Button>)
    const buttonElement = screen.getByRole('button', { name: /click me/i })
    expect(buttonElement).toBeInTheDocument()
  })

  it('should apply variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    const buttonElement = screen.getByRole('button', { name: /delete/i })
    expect(buttonElement).toHaveClass('text-destructive') // shadcn UI destructive variant class
  })
})
