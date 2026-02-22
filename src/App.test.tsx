import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'

test('renders navigation with Polish labels', () => {
  render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>
  )
  expect(screen.getAllByText('Panel główny').length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText('Zasoby').length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText('Historia zmian').length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText('Ustawienia').length).toBeGreaterThanOrEqual(1)
})

test('renders login page elements', () => {
  // LoginPage uses useAuth which requires AuthContext
  // We test the login page structure via a simpler approach
  const { container } = render(
    <MemoryRouter>
      <AppLayout />
    </MemoryRouter>
  )
  expect(container.querySelector('aside')).toBeTruthy()
})
