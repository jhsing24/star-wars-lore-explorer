import { describe, it, expect } from 'vitest'
import { patrolOffset } from './Hazard.js'

describe('patrolOffset', () => {
  it('is 0 at t=0 and stays within [-range, range]', () => {
    expect(patrolOffset(0, 100, 200)).toBeCloseTo(0, 5)
    for (let t = 0; t < 5000; t += 137) {
      const o = patrolOffset(t, 120, 200)
      expect(o).toBeGreaterThanOrEqual(-200.0001)
      expect(o).toBeLessThanOrEqual(200.0001)
    }
  })
  it('moves in the positive direction initially', () => {
    expect(patrolOffset(100, 100, 200)).toBeGreaterThan(0)
  })
})
