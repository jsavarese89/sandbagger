import React, { useState } from 'react';

function ShareRound({ roundId }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/round/${roundId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sandbagger Golf Scorecard',
          text: 'Join my golf round and track scores in real-time!',
          url: shareUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="share-section">
      <h4 className="info-card-header">Share Round</h4>
      <p>Share this link to let others view and update this scorecard in real-time:</p>

      <div className="share-link">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="share-input"
          onClick={(e) => e.target.select()}
        />
        <button
          onClick={handleCopy}
          className="copy-btn"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {navigator.share && (
        <button
          onClick={handleShare}
          className="btn"
        >
          Share using device
        </button>
      )}
    </div>
  );
}

export default ShareRound;
