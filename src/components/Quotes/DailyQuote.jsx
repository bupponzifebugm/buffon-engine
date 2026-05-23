import { DAILY_QUOTES } from '../../lib/constants';
import { getDayOfYear } from '../../lib/utils';
import { Quote } from 'lucide-react';

export default function DailyQuote() {
  const dayOfYear = getDayOfYear();
  const quote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];

  return (
    <div className="card quote-card">
      <Quote size={40} style={{ color: 'var(--accent)', opacity: 0.3, marginBottom: 24 }} />
      <div className="quote-text">"{quote.text}"</div>
      <div className="quote-author">— {quote.author}</div>
    </div>
  );
}
