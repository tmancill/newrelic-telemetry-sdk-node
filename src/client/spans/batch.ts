import { Span, SpanData } from './span'
import { AttributeMap } from '../attributeMap'

interface CommonSpanData {
  attributes?: AttributeMap
}

// TODO: Consider ability to send SpanBatch purely via interface. Would
// export in that case.
// TODO: Rename to avoid 'payload'. Find clear wording between interface
// and class.
interface SpanBatchPayload {
  spans?: SpanData[]
  common?: CommonSpanData
}

export const LIMIT = 2000

export class SpanBatch implements SpanBatchPayload {
  public common?: CommonSpanData
  public spans: Span[]

  public constructor(
    attributes?: AttributeMap,
    spans?: SpanData[]
  ) {
    if (attributes) {
      const common: CommonSpanData = {}

      common.attributes = attributes
      this.common = common
    }

    this.spans = spans || []
    // if the client programmer passed us an array that's
    // too big, keep the first `LIMIT` items and
    // then use addSpan to add the rest (making the later
    // items subject to the adaptive sampling)
    if (this.spans.length > LIMIT) {
      const remnant = this.spans.splice(LIMIT)
      this.addSpan(...remnant)
    }
  }

  public addSpan(...spans: Span[]): SpanBatch {
    for (let span of spans) {
      this.spans.push(span)
      const len = this.spans.length
      // keep spans array at its limited value
      if (len > LIMIT) {
        const indexToDrop = this.getRandomInt(0, len - 1)
        const droppedSpan = this.spans[indexToDrop]
        this.spans[indexToDrop] = this.spans[len - 1]
        this.spans[len - 1] = droppedSpan
        this.spans.pop()
      }
    }

    return this
  }

  // get a random number between min and max, inclusive
  protected getRandomInt(min: number, max: number): number {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(
      Math.random() * ((max + 1) - min)
    ) + min
  }
}
