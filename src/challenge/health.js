export default class Health {
  constructor(max = 100) {
    this.max = max
    this.current = max
  }
  damage(n) { this.current = Math.max(0, this.current - n); return this.current }
  heal(n) { this.current = Math.min(this.max, this.current + n); return this.current }
  setMax(n) { this.max = n; if (this.current > n) this.current = n }
  restore() { this.current = this.max }
  isDead() { return this.current <= 0 }
  isFull() { return this.current >= this.max }
}
