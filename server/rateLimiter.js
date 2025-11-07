class TokenBucket {
  constructor({ ratePerSecond, burst }) {
    this.ratePerMs = Math.max(0, Number(ratePerSecond || 0)) / 1000;
    this.capacity = Math.max(1, Number(burst || 1));
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed <= 0) return;
    const add = elapsed * this.ratePerMs;
    this.tokens = Math.min(this.capacity, this.tokens + add);
    this.lastRefill = now;
  }

  tryRemoveTokens(n) {
    this.refill();
    if (this.tokens >= n) {
      this.tokens -= n;
      return true;
    }
    return false;
  }
}

module.exports = { TokenBucket };


