export class UploadTracker {
  private pending = 0

  begin() {
    this.pending += 1
    return this.pending
  }

  end() {
    this.pending = Math.max(0, this.pending - 1)
    return this.pending
  }

  hasPending() {
    return this.pending > 0
  }

  current() {
    return this.pending
  }
}
