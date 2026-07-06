import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button Component', () => {
  it('should render a button element', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('should have the correct variant classes', () => {
    render(<Button variant="outline">Test</Button>)
    const button = screen.getByRole('button', { name: /test/i })
    expect(button).toHaveClass('border-border')
  })

  it('should accept disabled prop', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button', { name: /disabled/i })
    expect(button).toBeDisabled()
  })
})
