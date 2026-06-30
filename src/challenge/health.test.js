import { describe, it, expect } from 'vitest'
import Health from './health.js'

describe('Health', () => {
  it('starts full at the given max (default 100)', () => {
    expect(new Health().current).toBe(100)
    expect(new Health().max).toBe(100)
    expect(new Health(140).current).toBe(140)
  })
  it('damage clamps at 0 and reports death', () => {
    const h = new Health(100)
    h.damage(30); expect(h.current).toBe(70); expect(h.isDead()).toBe(false)
    h.damage(999); expect(h.current).toBe(0); expect(h.isDead()).toBe(true)
  })
  it('heal clamps at max', () => {
    const h = new Health(100); h.damage(50); h.heal(80)
    expect(h.current).toBe(100); expect(h.isFull()).toBe(true)
  })
  it('restore refills to max', () => {
    const h = new Health(100); h.damage(60); h.restore()
    expect(h.current).toBe(100)
  })
  it('setMax raises the ceiling without lowering current', () => {
    const h = new Health(100); h.damage(40) // current 60
    h.setMax(140)
    expect(h.max).toBe(140); expect(h.current).toBe(60)
  })
})
