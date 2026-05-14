'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { useLocale } from '@/i18n/context';
import { trackEvent } from '@/lib/analytics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isValid = EMAIL_RE.test(email.trim());

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(t.waitlistInvalidEmail);
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error();
      trackEvent('waitlist_submit', { email: trimmed });
      setDone(true);
    } catch {
      setError(t.waitlistError);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setEmail('');
      setError('');
      setDone(false);
    }, 200);
  };

  return (
    <Dialog open={open} onClose={handleClose} width="sm">
      <div className="flex justify-end -mt-1 -mx-1 mb-1">
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          aria-label={t.close}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {!done ? (
        <div className="flex flex-col items-center text-center gap-4 pb-2">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {t.joinWaitlist}
          </h2>
          <p className="text-[var(--fs-item)] text-[var(--muted-foreground)]">
            {t.waitlistDesc}
          </p>
          <div className="w-full flex flex-col gap-1.5">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="email@example.com"
              className="w-full px-4 py-3 rounded-[var(--radius)] bg-[var(--surface-btn)] border-none text-[var(--foreground)] text-[var(--fs-item)] focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--foreground)] transition-all"
              autoFocus
            />
            {error && (
              <p style={{ fontSize: 'var(--fs-tag)', color: 'var(--g-error)' }} className="text-left">{error}</p>
            )}
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full"
          >
            {loading ? '...' : t.confirm}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
            <span className="text-3xl">🎉</span>
          </div>
          <p className="text-[var(--fs-item)] text-[var(--muted-foreground)]">
            {t.waitlistDone}
          </p>
          <Button variant="primary" size="lg" onClick={handleClose} className="w-full">
            {t.confirm}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
